import React, { useState, useEffect, useRef } from 'react';
import { Product, ProductCategory, Order, DeliveryFee, Wilaya, PaymentMethod, OrderStatus } from './types';
import { ALGERIAN_WILAYAS, MOCK_PRODUCTS } from './constants';
// Note: You need to create firebase.ts and add your Firebase config
// import { db, auth } from './firebase'; 
// import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, orderBy } from "firebase/firestore";
// import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";


// ====================================================================
// ========================== MOCK / PLACEHOLDER ======================
// ====================================================================
// This is a placeholder for Firebase functionality.
// To make the app fully functional, you need to set up a Firebase project
// and replace these mock functions with actual Firebase calls.

const db = {}; // Placeholder
const auth = {}; // Placeholder

const useFirestoreCollection = <T,>(collectionName: string, initialData: T[]) => {
    const [data, setData] = useLocalStorage<T[]>(collectionName, initialData);
    return { data, loading: false, error: null };
};

const useAuth = () => {
    const [user, setUser] = useLocalStorage<boolean>('user', false);
    const login = (email: string, pass: string) => new Promise<void>(res => { setUser(true); res(); });
    const logout = () => new Promise<void>(res => { setUser(false); res(); });
    const signup = (email: string, pass: string) => new Promise<void>(res => { setUser(true); res(); });
    return { user, login, logout, signup };
}

// END OF MOCK
// ====================================================================


// Helper function to convert a file to a Base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};


// Custom hook for using localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// ====================================================================
// ========================== PUBLIC COMPONENTS =======================
// ====================================================================

const Header: React.FC = () => (
  <header className="bg-white shadow-sm sticky top-0 z-50">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <a href="/#" className="text-2xl font-bold text-indigo-700 cursor-pointer">متجري</a>
      <nav>
        <a href="/#" className="text-gray-600 hover:text-indigo-600 mx-4 cursor-pointer font-medium">الرئيسية</a>
      </nav>
    </div>
  </header>
);

const Footer: React.FC = () => (
    <footer className="bg-white mt-16 py-8 border-t">
        <div className="container mx-auto text-center text-gray-600">
            <p>&copy; {new Date().getFullYear()} متجري. كل الحقوق محفوظة.</p>
             <p className="text-sm mt-2">
                يعمل على <a href="https://58-k615.vercel.app" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">https://58-k615.vercel.app</a>
             </p>
            <div className="mt-4">
                <a href="#/admin" className="text-sm text-indigo-600 hover:underline">
                    الدخول للوحة التحكم
                </a>
            </div>
        </div>
    </footer>
);


const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <a href={`#/product/${product.id}`} className="block bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
        <div className="overflow-hidden h-56">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src={product.images[0]} alt={product.name} />
        </div>
        <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
            <p className="text-indigo-600 font-bold text-xl mt-2">{product.price.toLocaleString()} د.ج</p>
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full mt-2 inline-block">{product.category}</span>
        </div>
    </a>
);

const OrderModal: React.FC<{ product: Product; deliveryFees: DeliveryFee[]; onClose: () => void; onPlaceOrder: (orderData: Omit<Order, 'id' | 'timestamp' | 'status'>) => Promise<void> }> = ({ product, deliveryFees, onClose, onPlaceOrder }) => {
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [wilayaId, setWilayaId] = useState(ALGERIAN_WILAYAS[0].id);
    const [commune, setCommune] = useState('');
    const [address, setAddress] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.OnDelivery);
    const [notes, setNotes] = useState('');

    const [deliveryFee, setDeliveryFee] = useState(deliveryFees.find(df => df.wilayaId === ALGERIAN_WILAYAS[0].id)?.fee ?? 0);
    const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleWilayaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedWilayaId = parseInt(e.target.value);
        const fee = deliveryFees.find(df => df.wilayaId === selectedWilayaId)?.fee ?? 0;
        setWilayaId(selectedWilayaId);
        setDeliveryFee(fee);
    };

    const totalPrice = (product.price * quantity) + deliveryFee;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity < 1) {
            setError("الكمية يجب أن تكون 1 على الأقل.");
            return;
        }
        setSubmissionState('submitting');
        setError(null);
        const wilayaName = ALGERIAN_WILAYAS.find(w => w.id === wilayaId)?.name || '';
        
        try {
            await onPlaceOrder({
                productName: product.name,
                productId: product.id,
                productImage: product.images[0],
                pricePerItem: product.price,
                quantity,
                customerName,
                phone,
                wilaya: wilayaName,
                commune,
                address,
                deliveryFee,
                totalPrice,
                paymentMethod,
                notes,
            });
            setSubmissionState('success');
        } catch (err: any) {
            setError(err.message || 'فشل إرسال الطلب. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.');
            setSubmissionState('error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                <div className="p-6">
                    {submissionState === 'success' ? (
                        <div className="text-center p-8">
                            <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">تم استلام طلبك بنجاح!</h2>
                            <p className="text-gray-600 mb-6">شكراً لثقتك بنا. سنتواصل معك قريباً عبر الهاتف لتأكيد تفاصيل الشحن.</p>
                            <button onClick={onClose} className="bg-indigo-600 text-white font-bold py-2 px-8 rounded-md hover:bg-indigo-700 transition-colors">
                                إغلاق
                            </button>
                        </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-bold text-gray-800">طلب: {product.name}</h2>
                          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl" aria-label="إغلاق">&times;</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                    <strong className="font-bold">خطأ! </strong>
                                    <span className="block sm:inline ml-2">{error}</span>
                                </div>
                            )}

                            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">معلومات الزبون</h3>
                            <input type="text" placeholder="الاسم الكامل" value={customerName} onChange={e => setCustomerName(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                            <input type="tel" placeholder="رقم الهاتف" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                            
                            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 pt-2">معلومات التوصيل</h3>
                            <select value={wilayaId} onChange={handleWilayaChange} required className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-indigo-500 focus:border-indigo-500">
                                {ALGERIAN_WILAYAS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                            <input type="text" placeholder="البلدية (اختياري)" value={commune} onChange={e => setCommune(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                            <input type="text" placeholder="العنوان الكامل" value={address} onChange={e => setAddress(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />

                            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 pt-2">تفاصيل الطلب</h3>
                            <div className="flex items-center space-x-4 rtl:space-x-reverse">
                               <label htmlFor="quantity" className="font-medium">الكمية:</label>
                               <input id="quantity" type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required className="w-24 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            
                            <div>
                              <label className="font-medium">طريقة الدفع:</label>
                              <div className="mt-2 space-y-2">
                                {Object.values(PaymentMethod).map(method => (
                                  <label key={method} className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                                    <input type="radio" name="payment_method" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"/>
                                    <span className="ml-3 text-sm font-medium text-gray-700">{method}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <textarea placeholder="ملاحظات (اختياري)" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />

                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-md mt-6 text-center space-y-1">
                                <p className="text-md">سعر المنتج: <span className="font-bold">{(product.price * quantity).toLocaleString()} د.ج</span></p>
                                <p className="text-md">سعر التوصيل: <span className="font-bold">{deliveryFee.toLocaleString()} د.ج</span></p>
                                <p className="text-xl text-indigo-600">السعر الإجمالي: <span className="font-bold">{totalPrice.toLocaleString()} د.ج</span></p>
                            </div>

                            <button type="submit" disabled={submissionState === 'submitting'} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed mt-4">
                                {submissionState === 'submitting' ? 'جاري الإرسال...' : submissionState === 'error' ? 'حاول مرة أخرى' : 'تأكيد الطلب'}
                            </button>
                        </form>
                      </>
                    )}
                </div>
            </div>
        </div>
    );
};

const HomePage: React.FC<{ products: Product[] }> = ({ products }) => {
  const [filter, setFilter] = useState<ProductCategory | 'all'>('all');
  const categories: ('all' | ProductCategory)[] = ['all', ...Object.values(ProductCategory)];
  const filteredProducts = filter === 'all' ? products : products.filter(p => p.category === filter);

  return (
    <div>
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-center py-20 rounded-lg shadow-lg mb-12">
            <h2 className="text-4xl font-extrabold">مرحباً بك في متجري</h2>
            <p className="mt-4 text-lg opacity-90">أفضل المنتجات بأفضل الأسعار، تصلك أينما كنت في الجزائر</p>
        </div>
        
        <div className="mb-8 text-center">
            {categories.map(cat => (
                <button 
                    key={cat} 
                    onClick={() => setFilter(cat)}
                    className={`px-5 py-2 mx-1.5 my-1 rounded-full font-semibold transition-all duration-200 text-sm ${filter === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-indigo-600'}`}
                >
                    {cat === 'all' ? 'الكل' : cat}
                </button>
            ))}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
    </div>
  );
};

const ProductPage: React.FC<{ product: Product; onOrderNow: (product: Product) => void }> = ({ product, onOrderNow }) => {
  const [mainImage, setMainImage] = useState(product.images[0]);
  return (
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                  <img src={mainImage} alt={product.name} className="w-full h-auto rounded-lg object-cover mb-4 max-h-[500px] shadow-md" />
                  <div className="flex space-x-2 rtl:space-x-reverse">
                      {product.images.map((img, index) => (
                          <img key={index} src={img} onClick={() => setMainImage(img)} className={`w-20 h-20 rounded-md object-cover cursor-pointer border-2 transition-all ${mainImage === img ? 'border-indigo-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`} alt="thumbnail" />
                      ))}
                  </div>
                  {product.videoUrl && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">فيديو المنتج:</h3>
                      <video controls className="w-full rounded-lg shadow-md">
                        <source src={product.videoUrl} />
                        متصفحك لا يدعم عرض الفيديو.
                      </video>
                    </div>
                  )}
              </div>
              <div className="flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h2>
                  <p className="text-3xl font-bold text-indigo-600 mb-6">{product.price.toLocaleString()} د.ج</p>
                  <div className="prose text-gray-600 mb-8">
                    <p>{product.description}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 sm:rtl:space-x-reverse">
                      <button onClick={() => onOrderNow(product)} className="flex-1 flex items-center justify-center bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        اطلب الآن
                      </button>
                      <a href="https://wa.me/213000000000" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors">
                        <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.456l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.267.655 4.398 1.908 6.161l.227.368-1.13 4.135 4.224-1.119.341.205z"></path></svg>
                        واتساب
                      </a>
                  </div>
              </div>
          </div>
      </div>
  );
};


// ====================================================================
// ========================== ADMIN COMPONENTS ========================
// ====================================================================

const AdminLogin: React.FC<{ onLogin: (email: string, pass: string) => Promise<void> }> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await onLogin(email, password);
        } catch (err: any) {
            setError('فشل تسجيل الدخول. تأكد من البريد وكلمة المرور.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold text-center text-gray-800">تسجيل الدخول للوحة التحكم</h2>
                <p className="text-center text-gray-500 text-sm">هذه المنطقة مخصصة لصاحب المتجر فقط. لإعداد حسابك، استخدم Firebase Authentication.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 mt-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">كلمة المرور</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 mt-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50">
                            {isLoading ? 'جاري الدخول...' : 'دخول'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AdminProducts: React.FC<{products: Product[], setProducts: React.Dispatch<React.SetStateAction<Product[]>>}> = ({products, setProducts}) => {
    const initialFormState: Omit<Product, 'id'> & {id: string | null} = {id: null, name: '', description: '', price: 0, category: ProductCategory.Other, images: [], videoUrl: ''};
    const [form, setForm] = useState(initialFormState);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [videoPreview, setVideoPreview] = useState<string | undefined>('');
    
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const isEditing = form.id !== null;

    useEffect(() => {
      setImagePreviews(form.images);
      setVideoPreview(form.videoUrl);
    }, [form]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video') => {
      if (!e.target.files) return;

      if (fileType === 'image') {
        const files = Array.from(e.target.files);
        const base64Images = await Promise.all(files.map(fileToBase64));
        setForm(prev => ({ ...prev, images: [...prev.images, ...base64Images] }));
      } else {
        const file = e.target.files[0];
        if (file) {
          const base64Video = await fileToBase64(file);
          setForm(prev => ({ ...prev, videoUrl: base64Video }));
        }
      }
    };
    
    const removeImage = (index: number) => {
      setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index)}));
    }
    
    const removeVideo = () => {
      setForm(prev => ({...prev, videoUrl: ''}));
      if (videoInputRef.current) videoInputRef.current.value = '';
    }

    const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (form.images.length === 0) {
        alert("الرجاء رفع صورة واحدة على الأقل للمنتج.");
        return;
      }

      if (form.id) { // Editing
        setProducts(products.map(p => p.id === form.id ? { ...form, id: form.id } as Product : p));
      } else { // Adding
        setProducts([...products, { ...form, id: new Date().getTime().toString() } as Product]);
      }
      resetForm();
    }
    
    const handleEdit = (product: Product) => {
      setForm(product);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    }
    
    const handleDelete = (id: string) => {
      if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        setProducts(products.filter(p => p.id !== id));
      }
    };
    
    const resetForm = () => {
        setForm(initialFormState);
        if(imageInputRef.current) imageInputRef.current.value = '';
        if(videoInputRef.current) videoInputRef.current.value = '';
    }

    return <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="اسم المنتج" className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required />
                <textarea value={form.description} rows={4} onChange={e => setForm({...form, description: e.target.value})} placeholder="وصف المنتج" className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} placeholder="السعر (د.ج)" className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required />
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value as ProductCategory})} className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-indigo-500 focus:border-indigo-500">
                      {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">صور المنتج (الصورة الأولى هي الرئيسية)</label>
                  <input ref={imageInputRef} type="file" multiple accept="image/*" onChange={(e) => handleFileChange(e, 'image')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                  <div className="mt-4 flex flex-wrap gap-4">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="relative">
                        <img src={src} alt={`preview ${index}`} className="w-24 h-24 object-cover rounded-md shadow-sm"/>
                        <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">&times;</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">فيديو المنتج (اختياري)</label>
                  <input ref={videoInputRef} type="file" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                  {videoPreview && (
                    <div className="mt-4 relative w-48">
                      <video src={videoPreview} className="w-48 h-auto rounded-md shadow-sm" />
                      <button type="button" onClick={removeVideo} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">&times;</button>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 rtl:space-x-reverse pt-2">
                  <button type="submit" className="bg-indigo-600 text-white font-semibold px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm">{isEditing ? 'حفظ التعديلات' : 'إضافة المنتج'}</button>
                  <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-800 font-semibold px-6 py-2 rounded-md hover:bg-gray-300 transition-colors">{isEditing ? 'إلغاء التعديل' : 'مسح الحقول'}</button>
                </div>
            </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">قائمة المنتجات الحالية</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الصورة</th>
                            <th scope="col" className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                            <th scope="col" className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                            <th scope="col" className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {products.length > 0 ? products.map((p, index) => (
                            <tr key={p.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="py-2 px-4"><img src={p.images[0]} alt={p.name} className="w-16 h-16 object-cover rounded-md"/></td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-indigo-600">{p.price.toLocaleString()} د.ج</td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-medium space-x-2 rtl:space-x-reverse">
                                    <button onClick={() => handleEdit(p)} className="text-yellow-600 hover:text-yellow-800">تعديل</button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800">حذف</button>
                                </td>
                            </tr>
                        )) : <tr><td colSpan={4} className="text-center text-gray-500 py-6">لم تقم بإضافة أي منتجات بعد.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
}

const AdminDelivery: React.FC<{deliveryFees: DeliveryFee[], setDeliveryFees: React.Dispatch<React.SetStateAction<DeliveryFee[]>>}> = ({deliveryFees, setDeliveryFees}) => {
    const handleFeeChange = (wilayaId: number, fee: number) => {
        const newFees = deliveryFees.map(df => df.wilayaId === wilayaId ? {...df, fee: isNaN(fee) ? 0 : fee} : df);
        // Add logic to save to Firestore here
        setDeliveryFees(newFees);
    }
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">أسعار التوصيل</h3>
        <p className="text-gray-600 mb-6">قم بتحديد سعر التوصيل لكل ولاية. سيتم تطبيق السعر تلقائياً عند تقديم الزبون للطلب.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALGERIAN_WILAYAS.map(w => {
                const fee = deliveryFees.find(df => df.wilayaId === w.id)?.fee ?? 0;
                return (
                    <div key={w.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <label htmlFor={`fee-${w.id}`} className="font-medium text-gray-700">{w.name}</label>
                        <div className="relative">
                           <input id={`fee-${w.id}`} type="number" value={fee} onChange={e => handleFeeChange(w.id, parseInt(e.target.value))} className="w-32 p-2 border border-gray-300 rounded-md text-center focus:ring-indigo-500 focus:border-indigo-500" />
                           <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">د.ج</span>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    )
}

const AdminOrders: React.FC<{ orders: Order[] }> = ({ orders }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">إدارة الطلبات</h3>
             <div className="overflow-x-auto">
                <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">الطلب</th>
                            <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">الزبون</th>
                            <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">الإجمالي</th>
                            <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {orders.length > 0 ? orders.map(order => (
                            <tr key={order.id}>
                                <td className="py-4 px-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="shrink-0 h-12 w-12">
                                      <img className="h-12 w-12 rounded-md object-cover" src={order.productImage} alt={order.productName} />
                                    </div>
                                    <div className="mr-4">
                                      <div className="text-sm font-medium text-gray-900">{order.productName} (x{order.quantity})</div>
                                      <div className="text-sm text-gray-500">ID: {order.id.substring(0,6)}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                                  <div className="text-sm text-gray-500">{order.phone}</div>
                                  <div className="text-sm text-gray-500">{order.wilaya}</div>
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-indigo-600">{order.totalPrice.toLocaleString()} د.ج</td>
                                <td className="py-4 px-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {order.status}
                                    </span>
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(order.timestamp?.toDate?.() || Date.now()).toLocaleDateString('ar-DZ')}
                                </td>
                            </tr>
                        )) : <tr><td colSpan={5} className="text-center text-gray-500 py-10">لا توجد أي طلبات حالياً.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const AdminPage: React.FC<{ 
  onLogout: () => void;
}> = ({ onLogout }) => {
    const [activeView, setActiveView] = useState('orders');
    // Using mock/localstorage data for now
    const [products, setProducts] = useLocalStorage<Product[]>('products_db', MOCK_PRODUCTS.map(p => ({...p, id: p.id.toString() })));
    const [deliveryFees, setDeliveryFees] = useLocalStorage<DeliveryFee[]>('delivery_fees_db', ALGERIAN_WILAYAS.map(w => ({ wilayaId: w.id, fee: 500 })));
    const [orders, setOrders] = useLocalStorage<Order[]>('orders_db', []);


    const menuItems = [
      { id: 'orders', label: 'إدارة الطلبات', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>},
      { id: 'products', label: 'إدارة المنتجات', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg> },
      { id: 'delivery', label: 'أسعار التوصيل', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-2h8a1 1 0 001-1zM21 11V5a2 2 0 00-2-2H9.572a2 2 0 00-1.414.586l-2.286 2.286A2 2 0 005 7.286V11m16 0a2 2 0 01-2 2h-1m-1-4l-3 3m0 0l-3-3m3 3V3"></path></svg> },
    ]

    return (
        <div className="flex flex-col md:flex-row bg-gray-100 rounded-lg shadow-lg min-h-[80vh]">
            <aside className="w-full md:w-64 bg-gray-800 text-white flex-shrink-0 md:rounded-r-lg">
                <div className="p-4">
                    <h2 className="text-2xl font-bold">لوحة التحكم</h2>
                </div>
                <nav className="mt-4">
                    {menuItems.map(item => (
                       <button key={item.id} onClick={() => setActiveView(item.id)} className={`w-full text-right flex items-center space-x-2 rtl:space-x-reverse px-4 py-3 transition-colors duration-200 ${activeView === item.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                           {item.icon}
                           <span>{item.label}</span>
                       </button>
                    ))}
                    <button onClick={onLogout} className="w-full text-right flex items-center space-x-2 rtl:space-x-reverse px-4 py-3 text-gray-400 hover:bg-red-600 hover:text-white transition-colors duration-200 mt-6">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        <span>تسجيل الخروج</span>
                    </button>
                </nav>
            </aside>

            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                {activeView === 'orders' && <AdminOrders orders={orders} />}
                {activeView === 'products' && <AdminProducts products={products} setProducts={setProducts} />}
                {activeView === 'delivery' && <AdminDelivery deliveryFees={deliveryFees} setDeliveryFees={setDeliveryFees} />}
            </main>
        </div>
    );
};


// ====================================================================
// ========================= MAIN APP COMPONENT =======================
// ====================================================================

const App: React.FC = () => {
    // Using LocalStorage as a mock database
    const [products, setProducts] = useLocalStorage<Product[]>('products_db', MOCK_PRODUCTS.map(p => ({...p, id: p.id.toString() })));
    const [deliveryFees, setDeliveryFees] = useLocalStorage<DeliveryFee[]>('delivery_fees_db', ALGERIAN_WILAYAS.map(w => ({ wilayaId: w.id, fee: 500 })));
    const [orders, setOrders] = useLocalStorage<Order[]>('orders_db', []);
    
    // Auth State
    const { user: isAdminAuthenticated, login, logout } = useAuth();

    // Routing State
    const [route, setRoute] = useState(window.location.hash);

    // Order Modal State
    const [isOrderModalOpen, setOrderModalOpen] = useState(false);
    const [productToOrder, setProductToOrder] = useState<Product | null>(null);
    
    // Formspree - Hardcoded endpoint for reliability
    const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xrbrqwpk';

    useEffect(() => {
        const handleHashChange = () => {
        setRoute(window.location.hash);
        window.scrollTo(0, 0);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleOrderNow = (product: Product) => {
        setProductToOrder(product);
        setOrderModalOpen(true);
    };

    const handlePlaceOrder = async (orderData: Omit<Order, 'id' | 'timestamp' | 'status'>) => {
        const newOrder: Order = {
            ...orderData,
            id: new Date().getTime().toString(),
            timestamp: new Date(),
            status: OrderStatus.New,
        };
        
        // IMPORTANT: The order is only real if the notification is sent successfully.
        // Saving to localStorage here is only for the admin's own testing purposes.
        // The definitive record of orders is the admin's email inbox via Formspree.
        setOrders(prevOrders => [...prevOrders, newOrder]);
        
        const emailData = {
            '-- تفاصيل الطلب --': '',
            'المنتج': `${newOrder.productName} (x${newOrder.quantity})`,
            'السعر الإجمالي': `${newOrder.totalPrice.toLocaleString()} د.ج`,
            '-- معلومات الزبون --': '',
            'الاسم الكامل': newOrder.customerName,
            'رقم الهاتف': newOrder.phone,
            'الولاية': newOrder.wilaya,
            'العنوان': newOrder.address,
            'طريقة الدفع': newOrder.paymentMethod,
            'ملاحظات': newOrder.notes || 'لا يوجد',
        };

        const response = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(emailData),
        });

        if (!response.ok) {
            // Formspree often returns error details in the JSON body
            const errorData = await response.json().catch(() => ({})); // Catch if body is not JSON
            const errorMessage = errorData.errors?.map((e: any) => e.message).join(', ') || 'فشل إرسال الطلب إلى الخادم. الرجاء المحاولة مرة أخرى.';
            throw new Error(errorMessage);
        }
    };

    const renderPage = () => {
        const path = route.slice(1) || '/';

        if (path.startsWith('/product/')) {
            const id = path.split('/')[2];
            const product = products.find(p => p.id === id);
            return product ? <ProductPage product={product} onOrderNow={handleOrderNow} /> : <div className="text-center py-10">المنتج غير موجود</div>;
        }

        if (path === '/admin') {
            return isAdminAuthenticated ? <AdminPage onLogout={logout} /> : <AdminLogin onLogin={login} />;
        }
        
        return <HomePage products={products} />;
    };

    return (
        <div className="bg-slate-50 min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
            {renderPage()}
        </main>
        <Footer />
        {isOrderModalOpen && productToOrder && (
            <OrderModal
            product={productToOrder}
            deliveryFees={deliveryFees}
            onClose={() => setOrderModalOpen(false)}
            onPlaceOrder={handlePlaceOrder}
            />
        )}
        </div>
    );
};

export default App;
