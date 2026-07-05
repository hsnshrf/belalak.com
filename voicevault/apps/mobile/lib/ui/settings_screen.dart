import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../i18n/strings.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({
    super.key,
    required this.api,
    required this.locale,
    required this.onLocaleChanged,
  });

  final ApiClient api;
  final Locale locale;
  final ValueChanged<Locale> onLocaleChanged;

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        ListTile(
          title: const Text('Language / اللغة'),
          trailing: SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'en', label: Text('English')),
              ButtonSegment(value: 'ar', label: Text('العربية')),
            ],
            selected: {locale.languageCode},
            onSelectionChanged: (sel) => onLocaleChanged(Locale(sel.first)),
          ),
        ),
        const Divider(),
        const ListTile(
          leading: Icon(Icons.gavel),
          title: Text('Recording consent'),
          subtitle: Text(
            'Recording laws vary by country; many require all-party consent. '
            'VoiceVault reminds you before every call/meeting recording and can play '
            'an announcement tone. This is general information, not legal advice — '
            'check the law where you and the participants are located.',
          ),
        ),
        const Divider(),
        const ListTile(
          leading: Icon(Icons.phone_disabled),
          title: Text('Why can\'t VoiceVault record my phone calls directly?'),
          subtitle: Text(
            'iOS does not allow third-party apps to record cellular calls at all '
            '(Apple\'s own iOS 18.1+ call recording is not open to apps). On Android 10+ '
            'direct call audio is blocked on most devices. VoiceVault offers honest '
            'speakerphone capture instead of pretending otherwise.',
          ),
        ),
        const Divider(),
        ListTile(
          leading: const Icon(Icons.logout),
          title: Text(tr(context, 'nav.settings') == 'الإعدادات' ? 'تسجيل الخروج' : 'Log out'),
          onTap: () async {
            await api.clearTokens();
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Logged out')));
            }
          },
        ),
      ],
    );
  }
}
