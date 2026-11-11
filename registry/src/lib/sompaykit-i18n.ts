/**
 * SomPayKit UI strings in Somali, English and Arabic. Error messages live in @sompaykit/core
 * (`message(code, locale)`); this file holds the labels around them.
 *
 * Placeholders look like `{amount}`. Use `fill()` to put text or elements in them.
 *
 * TODO(REVIEW): Somali and Arabic strings are drafts. Have native speakers check them before v1.0.
 * Edit freely: this file is yours once installed.
 */
import type { Locale, PaymentStatus } from '@sompaykit/core';

export interface SomPayMessages {
  checkout: {
    fullName: string;
    nameRequired: string;
    phone: string;
    detected: string;
    continue: string;
    payWith: string;
    items: string;
    total: string;
    secure: string;
  };
  wallet: {
    legend: string;
  };
  manual: {
    sendExactly: string;
    via: string;
    viaTo: string;
    copy: string;
    copied: string;
    dial: string;
    dialHint: string;
    noDial: string;
    afterYouPay: string;
    transactionId: string;
    transactionIdPlaceholder: string;
    transactionIdRequired: string;
    screenshot: string;
    optional: string;
    sent: string;
    help: string;
  };
  status: {
    badge: Record<PaymentStatus, string>;
    title: Record<PaymentStatus, string>;
    body: Record<PaymentStatus, string>;
    checking: string;
    weakConnection: string;
    timeLeft: string;
    dontClose: string;
    tryAgain: string;
    useAnotherWallet: string;
  };
}

const en: SomPayMessages = {
  checkout: {
    fullName: 'Full name',
    nameRequired: 'Please enter your name.',
    phone: 'Mobile money number',
    detected: 'We detected {wallet} from your number. Change it below if needed.',
    continue: 'Continue to payment',
    payWith: 'Pay {amount} with {wallet}',
    items: '{count} items',
    total: 'Total',
    secure: 'Secure checkout · your PIN is never shared with the store',
  },
  wallet: {
    legend: 'Pay with',
  },
  manual: {
    sendExactly: 'Send exactly',
    via: 'via {wallet}',
    viaTo: 'via {wallet} to {store}',
    copy: 'Copy',
    copied: 'Copied',
    dial: 'Dial to pay now',
    dialHint: 'Opens your phone dialler with the amount filled in',
    noDial: 'Send the money from your {wallet} menu.',
    afterYouPay: 'After you pay',
    transactionId: 'Transaction ID from your SMS',
    transactionIdPlaceholder: 'e.g. 12345678',
    transactionIdRequired: 'Please enter the transaction ID from your SMS.',
    screenshot: 'Add a screenshot',
    optional: '(optional)',
    sent: "I've sent the payment",
    help: 'Need help? Message the store on WhatsApp',
  },
  status: {
    badge: {
      pending: 'Waiting for PIN',
      awaiting_proof: 'Waiting for payment',
      awaiting_confirmation: 'Awaiting confirmation',
      paid: 'Paid',
      failed: 'Failed',
      expired: 'Expired',
    },
    title: {
      pending: 'Check your phone',
      awaiting_proof: 'Send the payment',
      awaiting_confirmation: "We're checking your payment",
      paid: 'Payment received',
      failed: "Payment didn't go through",
      expired: 'Time ran out',
    },
    body: {
      pending:
        'A payment request for {amount} was sent to {phone}. Enter your {wallet} PIN to approve it.',
      awaiting_proof: 'Send {amount}, then share the transaction ID from your SMS.',
      awaiting_confirmation: 'The store will confirm your {amount} payment shortly.',
      paid: 'Thank you. Your order is confirmed.',
      failed: 'The payment was not completed.',
      expired: "We didn't receive your payment in time. No money was taken.",
    },
    checking: 'Checking your payment…',
    weakConnection: 'Weak connection. We keep checking.',
    timeLeft: 'Time left',
    dontClose: "Don't close this page. It updates on its own.",
    tryAgain: 'Try again',
    useAnotherWallet: 'Use another wallet',
  },
};

const so: SomPayMessages = {
  checkout: {
    fullName: 'Magaca oo buuxa',
    nameRequired: 'Fadlan geli magacaaga.',
    phone: 'Lambarka lacagta mobilka',
    detected: 'Lambarkaaga waxaan ka garanay {wallet}. Hoos ka beddel haddii loo baahdo.',
    continue: 'U gudub lacag bixinta',
    payWith: 'Ku bixi {amount} {wallet}',
    items: '{count} shay',
    total: 'Wadarta',
    secure: 'Lacag bixin ammaan ah · PIN-kaaga lalama wadaago dukaanka',
  },
  wallet: {
    legend: 'Ku bixi',
  },
  manual: {
    sendExactly: 'Dir lacag dhan',
    via: '{wallet} ahaan',
    viaTo: '{wallet} ahaan u dir {store}',
    copy: 'Koobiyee',
    copied: 'Waa la koobiyeeyay',
    dial: 'Garaac oo hadda bixi',
    dialHint: 'Wuxuu furayaa taleefankaaga iyadoo lacagta horay loo qoray',
    noDial: 'Lacagta ka dir liiska {wallet}.',
    afterYouPay: 'Markaad bixiso kadib',
    transactionId: 'Lambarka macaamilka ee SMS-ka',
    transactionIdPlaceholder: 'tusaale 12345678',
    transactionIdRequired: 'Fadlan geli lambarka macaamilka ee SMS-ka.',
    screenshot: 'Ku dar sawir shaashadda',
    optional: '(ikhtiyaari)',
    sent: 'Lacagta waan diray',
    help: 'Caawimaad ma rabtaa? Dukaanka kala xiriir WhatsApp',
  },
  status: {
    badge: {
      pending: 'Sugaya PIN',
      awaiting_proof: 'Sugaya lacagta',
      awaiting_confirmation: 'Sugaya xaqiijin',
      paid: 'La bixiyay',
      failed: 'Way fashilantay',
      expired: 'Waqtigu wuu dhamaaday',
    },
    title: {
      pending: 'Geli PIN-kaaga taleefankaaga',
      awaiting_proof: 'Dir lacagta',
      awaiting_confirmation: 'Waxaan sugaynaa xaqiijinta ganacsadaha',
      paid: 'Lacagta waa la helay',
      failed: 'Lacag bixinta way fashilantay',
      expired: 'Waqtigii wuu dhamaaday',
    },
    body: {
      pending:
        'Codsi lacag bixin oo dhan {amount} ayaa loo diray {phone}. Geli PIN-ka {wallet} si aad u ogolaato.',
      awaiting_proof: 'Dir {amount}, kadibna noo soo dir lambarka macaamilka ee SMS-ka.',
      awaiting_confirmation: 'Dukaanku dhawaan ayuu xaqiijin doonaa lacagtaada {amount}.',
      paid: 'Mahadsanid. Dalabkaaga waa la xaqiijiyay.',
      failed: 'Lacag bixinta lama dhamaystirin.',
      expired: 'Lacagtaada waqtigeeda laguma helin. Wax lacag ah lagaama jarin.',
    },
    checking: 'Lacag bixinta waa la hubinayaa…',
    weakConnection: 'Xiriirku waa liita. Waan sii hubinaynaa.',
    timeLeft: 'Waqtiga haray',
    dontClose: 'Boggan ha xirin. Iskiis ayuu isu cusboonaysiinayaa.',
    tryAgain: 'Isku day mar kale',
    useAnotherWallet: 'Isticmaal hab kale',
  },
};

const ar: SomPayMessages = {
  checkout: {
    fullName: 'الاسم الكامل',
    nameRequired: 'يرجى إدخال اسمك.',
    phone: 'رقم المحفظة',
    detected: 'تعرّفنا على {wallet} من رقمك. يمكنك تغييرها أدناه.',
    continue: 'المتابعة إلى الدفع',
    payWith: 'ادفع {amount} عبر {wallet}',
    items: '{count} منتجات',
    total: 'الإجمالي',
    secure: 'دفع آمن · لا تتم مشاركة رمزك السري مع المتجر',
  },
  wallet: {
    legend: 'الدفع عبر',
  },
  manual: {
    sendExactly: 'أرسل بالضبط',
    via: 'عبر {wallet}',
    viaTo: 'عبر {wallet} إلى {store}',
    copy: 'نسخ',
    copied: 'تم النسخ',
    dial: 'اطلب للدفع الآن',
    dialHint: 'يفتح تطبيق الاتصال مع إدخال المبلغ',
    noDial: 'أرسل المبلغ من قائمة {wallet}.',
    afterYouPay: 'بعد الدفع',
    transactionId: 'رقم العملية من الرسالة النصية',
    transactionIdPlaceholder: 'مثال 12345678',
    transactionIdRequired: 'يرجى إدخال رقم العملية من الرسالة النصية.',
    screenshot: 'أضف لقطة شاشة',
    optional: '(اختياري)',
    sent: 'لقد أرسلت المبلغ',
    help: 'تحتاج مساعدة؟ راسل المتجر على واتساب',
  },
  status: {
    badge: {
      pending: 'بانتظار الرمز السري',
      awaiting_proof: 'بانتظار الدفع',
      awaiting_confirmation: 'بانتظار التأكيد',
      paid: 'مدفوع',
      failed: 'فشل',
      expired: 'منتهي',
    },
    title: {
      pending: 'تحقق من هاتفك',
      awaiting_proof: 'أرسل المبلغ',
      awaiting_confirmation: 'نراجع دفعتك الآن',
      paid: 'تم استلام الدفع',
      failed: 'لم تكتمل عملية الدفع',
      expired: 'انتهى الوقت',
    },
    body: {
      pending: 'أُرسل طلب دفع بقيمة {amount} إلى {phone}. أدخل الرمز السري لـ {wallet} للموافقة.',
      awaiting_proof: 'أرسل {amount} ثم شارك رقم العملية من الرسالة النصية.',
      awaiting_confirmation: 'سيؤكد المتجر دفعتك البالغة {amount} قريبًا.',
      paid: 'شكرًا لك. تم تأكيد طلبك.',
      failed: 'لم تكتمل عملية الدفع.',
      expired: 'لم نستلم دفعتك في الوقت المحدد. لم يُخصم أي مبلغ.',
    },
    checking: 'جارٍ التحقق من الدفع…',
    weakConnection: 'الاتصال ضعيف. نواصل التحقق.',
    timeLeft: 'الوقت المتبقي',
    dontClose: 'لا تغلق هذه الصفحة. تتحدث تلقائيًا.',
    tryAgain: 'حاول مرة أخرى',
    useAnotherWallet: 'استخدم محفظة أخرى',
  },
};

export const SOMPAY_MESSAGES: Readonly<Record<Locale, SomPayMessages>> = { so, en, ar };

export function getMessages(locale: Locale): SomPayMessages {
  return SOMPAY_MESSAGES[locale] ?? SOMPAY_MESSAGES.so;
}

/** Text direction for a locale: Arabic is right-to-left. */
export function dirFor(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Fills `{name}` placeholders. Values can be strings or React elements, so numbers and phone
 * numbers can be wrapped in `<bdi dir="ltr">` inside right-to-left text.
 */
export function fill<T>(template: string, values: Readonly<Record<string, T>>): (string | T)[] {
  return template
    .split(/(\{\w+\})/)
    .filter((part) => part !== '')
    .map((part) => {
      const key = /^\{(\w+)\}$/.exec(part)?.[1];
      return key !== undefined && Object.hasOwn(values, key) ? (values[key] as T) : part;
    });
}

/** `fill()` for plain strings. */
export function fillText(template: string, values: Readonly<Record<string, string>>): string {
  return fill(template, values).join('');
}
