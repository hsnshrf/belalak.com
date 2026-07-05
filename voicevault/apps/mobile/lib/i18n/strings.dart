/// UI strings, EN + AR (mirrors apps/web/src/lib/i18n/messages.ts).
library;

import 'package:flutter/widgets.dart';

const supportedLocales = [Locale('en'), Locale('ar')];

const Map<String, Map<String, String>> _messages = {
  'en': {
    'app.name': 'VoiceVault',
    'nav.library': 'Library',
    'nav.record': 'Record',
    'nav.search': 'Search',
    'nav.settings': 'Settings',
    'record.start': 'Start recording',
    'record.stop': 'Stop',
    'record.pause': 'Pause',
    'record.resume': 'Resume',
    'record.source.mic': 'Microphone',
    'record.source.meeting': 'Meeting (speakerphone)',
    'record.source.call': 'Call (speakerphone)',
    'consent.title': 'Before you record',
    'consent.body':
        'Recording laws vary by country; many places require consent from every participant. Make sure everyone knows this conversation is being recorded.',
    'consent.ack': 'I have obtained consent from all participants',
    'consent.announce': 'Play a short "this call is being recorded" announcement',
    'consent.cancel': 'Cancel',
    'consent.continue': 'Start recording',
    'library.empty': 'No recordings yet — tap the mic to create your first one.',
    'library.transcribing': 'Transcribing…',
    'search.hint': 'Search every word you\'ve recorded…',
    'search.offline': 'Offline results',
    'recovered.title': 'Recording recovered',
    'recovered.body': 'An interrupted recording was saved and its upload resumed.',
  },
  'ar': {
    'app.name': 'ﭬويس فولت',
    'nav.library': 'المكتبة',
    'nav.record': 'تسجيل',
    'nav.search': 'بحث',
    'nav.settings': 'الإعدادات',
    'record.start': 'بدء التسجيل',
    'record.stop': 'إيقاف',
    'record.pause': 'إيقاف مؤقت',
    'record.resume': 'استئناف',
    'record.source.mic': 'الميكروفون',
    'record.source.meeting': 'اجتماع (مكبر الصوت)',
    'record.source.call': 'مكالمة (مكبر الصوت)',
    'consent.title': 'قبل أن تسجّل',
    'consent.body':
        'تختلف قوانين التسجيل بين الدول؛ كثير منها يشترط موافقة جميع المشاركين. تأكد من علم الجميع بأن هذه المحادثة تُسجَّل.',
    'consent.ack': 'حصلت على موافقة جميع المشاركين',
    'consent.announce': 'تشغيل تنبيه قصير «هذه المكالمة تُسجَّل»',
    'consent.cancel': 'إلغاء',
    'consent.continue': 'بدء التسجيل',
    'library.empty': 'لا توجد تسجيلات بعد — اضغط على الميكروفون لإنشاء أول تسجيل.',
    'library.transcribing': 'جارٍ التفريغ…',
    'search.hint': 'ابحث في كل كلمة سجّلتها…',
    'search.offline': 'نتائج دون اتصال',
    'recovered.title': 'تم استرداد التسجيل',
    'recovered.body': 'حُفظ تسجيل متقطع واستُؤنف رفعه.',
  },
};

String tr(BuildContext context, String key) {
  final code = Localizations.localeOf(context).languageCode;
  return _messages[code]?[key] ?? _messages['en']![key] ?? key;
}
