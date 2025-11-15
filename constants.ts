import { Product, ProductCategory, Wilaya } from './types';

export const ALGERIAN_WILAYAS: Wilaya[] = [
    { id: 1, name: "أدرار" }, { id: 2, name: "الشلف" }, { id: 3, name: "الأغواط" },
    { id: 4, name: "أم البواقي" }, { id: 5, name: "باتنة" }, { id: 6, name: "بجاية" },
    { id: 7, name: "بسكرة" }, { id: 8, name: "بشار" }, { id: 9, name: "البليدة" },
    { id: 10, name: "البويرة" }, { id: 11, name: "تمنراست" }, { id: 12, name: "تبسة" },
    { id: 13, name: "تلمسان" }, { id: 14, name: "تيارت" }, { id: 15, name: "تيزي وزو" },
    { id: 16, name: "الجزائر" }, { id: 17, name: "الجلفة" }, { id: 18, name: "جيجل" },
    { id: 19, name: "سطيف" }, { id: 20, name: "سعيدة" }, { id: 21, name: "سكيكدة" },
    { id: 22, name: "سيدي بلعباس" }, { id: 23, name: "عنابة" }, { id: 24, name: "قالمة" },
    { id: 25, name: "قسنطينة" }, { id: 26, name: "المدية" }, { id: 27, name: "مستغانم" },
    { id: 28, name: "المسيلة" }, { id: 29, name: "معسكر" }, { id: 30, name: "ورقلة" },
    { id: 31, name: "وهران" }, { id: 32, name: "البيض" }, { id: 33, name: "إليزي" },
    { id: 34, name: "برج بوعريريج" }, { id: 35, name: "بومرداس" }, { id: 36, name: "الطارف" },
    { id: 37, name: "تندوف" }, { id: 38, name: "تيسمسيلت" }, { id: 39, name: "الوادي" },
    { id: 40, name: "خنشلة" }, { id: 41, name: "سوق أهراس" }, { id: 42, name: "تيبازة" },
    { id: 43, name: "ميلة" }, { id: 44, name: "عين الدفلى" }, { id: 45, name: "النعامة" },
    { id: 46, name: "عين تموشنت" }, { id: 47, name: "غرداية" }, { id: 48, name: "غليزان" },
    { id: 49, name: "المغير" }, { id: 50, name: "المنيعة" }, { id: 51, name: "أولاد جلال" },
    { id: 52, name: "برج باجي مختار" }, { id: 53, name: "بني عباس" }, { id: 54, name: "تيميمون" },
    { id: 55, name: "تقرت" }, { id: 56, name: "جانت" }, { id: 57, name: "عين صالح" },
    { id: 58, name: "عين قزام" }
];


export const MOCK_PRODUCTS: Product[] = [
    {
        id: 1,
        name: "سماعات رأس لاسلكية",
        description: "سماعات رأس لاسلكية عالية الجودة مع عزل للضوضاء وبطارية تدوم طويلاً. مثالية للاستماع للموسيقى والمكالمات.",
        price: 7500,
        category: ProductCategory.Electronics,
        images: [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1546435770-a3e426bf4022?q=80&w=2070&auto=format&fit=crop",
        ]
    },
    {
        id: 2,
        name: "قميص قطني فاخر",
        description: "قميص عصري مصنوع من القطن المصري الفاخر. متوفر بعدة ألوان ومقاسات ليناسب جميع الأذواق.",
        price: 3200,
        category: ProductCategory.Clothing,
        images: [
            "https://images.unsplash.com/photo-1581655353564-df123a50ba35?q=80&w=1974&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1620799140408-edc6d5f9650d?q=80&w=1972&auto=format&fit=crop",
        ]
    },
    {
        id: 3,
        name: "ماكينة قهوة حديثة",
        description: "ابدأ يومك بكوب قهوة مثالي. ماكينة سهلة الاستخدام، تحضر الإسبريسو والكابتشينو بلمسة زر.",
        price: 12000,
        category: ProductCategory.Appliances,
        images: [
            "https://images.unsplash.com/photo-1565452344012-752e55a1a1f5?q=80&w=1974&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1611893343039-5509b6910a9e?q=80&w=1964&auto=format&fit=crop",
        ]
    },
    {
        id: 4,
        name: "مجموعة مفكات براغي",
        description: "مجموعة متكاملة من مفكات البراغي لجميع احتياجاتك المنزلية والاحترافية. مصنوعة من الفولاذ المقاوم للصدأ.",
        price: 4500,
        category: ProductCategory.Tools,
        images: [
            "https://images.unsplash.com/photo-1618932331513-3395c879158e?q=80&w=2070&auto=format&fit=crop",
        ]
    },
     {
        id: 5,
        name: "ساعة يد أنيقة",
        description: "ساعة يد بتصميم كلاسيكي وحركة كوارتز دقيقة. مقاومة للماء ومناسبة لجميع المناسبات.",
        price: 9800,
        category: ProductCategory.Other,
        images: [
            "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1976&auto=format&fit=crop",
        ]
    },
    {
        id: 6,
        name: "حقيبة ظهر للابتوب",
        description: "حقيبة ظهر متينة وأنيقة مع جيب مبطن لحماية الكمبيوتر المحمول. مساحة تخزين واسعة ومقاومة للماء.",
        price: 5500,
        category: ProductCategory.Electronics,
        images: [
            "https://images.unsplash.com/photo-1553062407-98eeb68c6a62?q=80&w=1974&auto=format&fit=crop",
        ]
    }
];
