import 'dart:convert';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Thin API client with bearer auth, one transparent refresh on 401, and
/// exponential-backoff retries for chunk uploads. Failures throw — callers
/// surface them; audio loss is never silent.
class ApiClient {
  ApiClient({required this.baseUrl, http.Client? inner}) : _http = inner ?? http.Client();

  final String baseUrl;
  final http.Client _http;

  static const _accessKey = 'vv.accessToken';
  static const _refreshKey = 'vv.refreshToken';

  Future<String?> get _access async => (await SharedPreferences.getInstance()).getString(_accessKey);

  Future<void> saveTokens(String access, String refresh) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessKey, access);
    await prefs.setString(_refreshKey, refresh);
  }

  Future<void> clearTokens() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessKey);
    await prefs.remove(_refreshKey);
  }

  Future<bool> get isLoggedIn async => (await _access) != null;

  Future<Map<String, dynamic>> login(String email, String password) =>
      _authCall('/v1/auth/login', {'email': email, 'password': password});

  Future<Map<String, dynamic>> signup(String email, String password, String displayName) =>
      _authCall('/v1/auth/signup', {'email': email, 'password': password, 'displayName': displayName});

  Future<Map<String, dynamic>> _authCall(String path, Map<String, dynamic> body) async {
    final res = await _http.post(
      Uri.parse('$baseUrl$path'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode(body),
    );
    final decoded = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 400) {
      throw ApiException(res.statusCode, decoded['message']?.toString() ?? 'Auth failed');
    }
    await saveTokens(decoded['accessToken'] as String, decoded['refreshToken'] as String);
    return decoded;
  }

  Future<bool> _tryRefresh() async {
    final prefs = await SharedPreferences.getInstance();
    final refresh = prefs.getString(_refreshKey);
    if (refresh == null) return false;
    final res = await _http.post(
      Uri.parse('$baseUrl/v1/auth/refresh'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({'refreshToken': refresh}),
    );
    if (res.statusCode != 200) {
      await clearTokens();
      return false;
    }
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    await saveTokens(body['accessToken'] as String, body['refreshToken'] as String);
    return true;
  }

  Future<dynamic> request(
    String method,
    String path, {
    Object? jsonBody,
    Uint8List? rawBody,
    Map<String, String>? headers,
    bool retried = false,
  }) async {
    final req = http.Request(method, Uri.parse('$baseUrl$path'));
    final access = await _access;
    if (access != null) req.headers['authorization'] = 'Bearer $access';
    if (headers != null) req.headers.addAll(headers);
    if (jsonBody != null) {
      req.headers['content-type'] = 'application/json';
      req.body = jsonEncode(jsonBody);
    } else if (rawBody != null) {
      req.headers['content-type'] = 'application/octet-stream';
      req.bodyBytes = rawBody;
    }
    final streamed = await _http.send(req);
    final res = await http.Response.fromStream(streamed);
    if (res.statusCode == 401 && !retried && await _tryRefresh()) {
      return request(method, path, jsonBody: jsonBody, rawBody: rawBody, headers: headers, retried: true);
    }
    if (res.statusCode >= 400) {
      String message = 'Request failed (${res.statusCode})';
      try {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['message'] != null) message = decoded['message'].toString();
      } catch (_) {}
      throw ApiException(res.statusCode, message);
    }
    if (res.body.isEmpty) return null;
    return jsonDecode(res.body);
  }

  /// Upload one chunk with sha256 integrity header and backoff retries.
  Future<void> uploadChunk({
    required String sessionId,
    required int seq,
    required Uint8List bytes,
    required bool isLast,
    int attempts = 4,
  }) async {
    final digest = sha256.convert(bytes).toString();
    Object? lastErr;
    for (var attempt = 0; attempt < attempts; attempt++) {
      try {
        await request(
          'PUT',
          '/v1/uploads/sessions/$sessionId/chunks/$seq',
          rawBody: bytes,
          headers: {'x-chunk-sha256': digest, 'x-chunk-is-last': '$isLast'},
        );
        return;
      } catch (err) {
        lastErr = err;
        await Future<void>.delayed(Duration(seconds: 2 << attempt));
      }
    }
    throw ApiException(0, 'Chunk $seq failed after $attempts attempts: $lastErr');
  }
}

class ApiException implements Exception {
  const ApiException(this.status, this.message);

  final int status;
  final String message;

  @override
  String toString() => 'ApiException($status): $message';
}
