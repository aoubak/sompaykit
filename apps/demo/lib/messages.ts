// Demo shop strings (so/en/ar). Payment strings come from the registry's sompaykit-i18n.
// TODO(REVIEW): Somali and Arabic wording by a native speaker before launch.
import type { Locale } from '@sompaykit/core';

export interface ShopMessages {
  storeName: string;
  demoNotice: string;
  language: string;
  categories: Record<'all' | 'food' | 'beauty' | 'electronics', string>;
  addToCart: string;
  added: string;
  /** `{count}` */
  cartLabel: string;
  /** `{count}` */
  viewCart: string;
  cartTitle: string;
  cartEmpty: string;
  backToShop: string;
  back: string;
  remove: string;
  decrease: string;
  increase: string;
  subtotal: string;
  delivery: string;
  deliveryValue: string;
  total: string;
  payNote: string;
  /** `{amount}` */
  checkout: string;
  checkoutTitle: string;
  payTitle: string;
  statusTitle: string;
  preparing: string;
  orderFailed: string;
  retry: string;
  newOrder: string;
}

const en: ShopMessages = {
  storeName: 'Hodan Store',
  demoNotice: 'Demo store: no real money. Don’t send anything; payments confirm themselves.',
  language: 'Language',
  categories: { all: 'All', food: 'Food', beauty: 'Beauty', electronics: 'Electronics' },
  addToCart: 'Add to cart',
  added: 'Added',
  cartLabel: 'Cart, {count} items',
  viewCart: '{count} items · View cart',
  cartTitle: 'Your cart',
  cartEmpty: 'Your cart is empty.',
  backToShop: 'Back to shop',
  back: 'Back',
  remove: 'Remove',
  decrease: 'One less',
  increase: 'One more',
  subtotal: 'Subtotal',
  delivery: 'Delivery',
  deliveryValue: 'Arranged on WhatsApp',
  total: 'Total',
  payNote: 'Pay with EVC Plus, Zaad, Sahal or eDahab. No card needed.',
  checkout: 'Checkout · {amount}',
  checkoutTitle: 'Checkout',
  payTitle: 'Pay',
  statusTitle: 'Payment',
  preparing: 'Preparing your order…',
  orderFailed: 'We couldn’t prepare your order. Check your connection and try again.',
  retry: 'Try again',
  newOrder: 'Shop again',
};

const so: ShopMessages = {
  storeName: 'Dukaanka Hodan',
  demoNotice:
    'Dukaan tijaabo ah: lacag dhab ah ma jirto. Waxba ha dirin; lacag-bixintu way is xaqiijinaysaa.',
  language: 'Luqadda',
  categories: { all: 'Dhammaan', food: 'Cunto', beauty: 'Qurxin', electronics: 'Elektaroonig' },
  addToCart: 'Ku dar dambiisha',
  added: 'Waa la daray',
  cartLabel: 'Dambiisha, {count} shay',
  viewCart: '{count} shay · Eeg dambiisha',
  cartTitle: 'Dambiishaada',
  cartEmpty: 'Dambiishaadu waa madhan tahay.',
  backToShop: 'Ku noqo dukaanka',
  back: 'Dib u noqo',
  remove: 'Ka saar',
  decrease: 'Mid ka yaree',
  increase: 'Mid ku dar',
  subtotal: 'Wadarta hoose',
  delivery: 'Gaarsiin',
  deliveryValue: 'Waxaa lagu habeynayaa WhatsApp',
  total: 'Wadarta',
  payNote: 'Ku bixi EVC Plus, Zaad, Sahal ama eDahab. Kaarka looma baahna.',
  checkout: 'Lacag bixi · {amount}',
  checkoutTitle: 'Lacag bixinta',
  payTitle: 'Bixi',
  statusTitle: 'Lacag bixinta',
  preparing: 'Dalabkaaga waa la diyaarinayaa…',
  orderFailed: 'Dalabkaaga lama diyaarin karin. Hubi internetkaaga oo isku day mar kale.',
  retry: 'Isku day mar kale',
  newOrder: 'Mar kale wax iibso',
};

const ar: ShopMessages = {
  storeName: 'متجر هودان',
  demoNotice: 'متجر تجريبي: لا أموال حقيقية. لا ترسل شيئًا؛ يتم تأكيد الدفع تلقائيًا.',
  language: 'اللغة',
  categories: { all: 'الكل', food: 'طعام', beauty: 'تجميل', electronics: 'إلكترونيات' },
  addToCart: 'أضف إلى السلة',
  added: 'تمت الإضافة',
  cartLabel: 'السلة، {count} منتجات',
  viewCart: '{count} منتجات · عرض السلة',
  cartTitle: 'سلتك',
  cartEmpty: 'سلتك فارغة.',
  backToShop: 'العودة إلى المتجر',
  back: 'رجوع',
  remove: 'إزالة',
  decrease: 'إنقاص واحد',
  increase: 'زيادة واحد',
  subtotal: 'المجموع الفرعي',
  delivery: 'التوصيل',
  deliveryValue: 'يتم الترتيب عبر واتساب',
  total: 'الإجمالي',
  payNote: 'ادفع عبر EVC Plus أو Zaad أو Sahal أو eDahab. لا حاجة لبطاقة.',
  checkout: 'الدفع · {amount}',
  checkoutTitle: 'إتمام الشراء',
  payTitle: 'الدفع',
  statusTitle: 'الدفع',
  preparing: 'جارٍ تجهيز طلبك…',
  orderFailed: 'تعذّر تجهيز طلبك. تحقق من الاتصال وحاول مرة أخرى.',
  retry: 'حاول مرة أخرى',
  newOrder: 'تسوّق مرة أخرى',
};

export const SHOP_MESSAGES: Readonly<Record<Locale, ShopMessages>> = { so, en, ar };
