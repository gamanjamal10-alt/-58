import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, Order, DeliveryFee } from './types';
import { ALGERIAN_WILAYAS, MOCK_PRODUCTS } from './constants';

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

const OrderModal: React.FC<{ product: Product; deliveryFees: DeliveryFee[]; onClose: () => void; onPlaceOrder: (order: any) => void }> = ({ product, deliveryFees, onClose, onPlaceOrder }) => {
    const [formData, setFormData] = useState({ name: '', phone: '', wilayaId: ALGERIAN_WILAYAS[0].id, municipality: '', address: '' });
    const [deliveryFee, setDeliveryFee] = useState(deliveryFees.find(df => df.wilayaId === ALGERIAN_WILAYAS[0].id)?.fee ?? 0);

    const handleWilayaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const wilayaId = parseInt(e.target.value);
        const fee = deliveryFees.find(df => df.wilayaId === wilayaId)?.fee ?? 0;
        setFormData({ ...formData, wilayaId });
        setDeliveryFee(fee);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const wilaya = ALGERIAN_WILAYAS.find(w => w.id === formData.wilayaId)?.name || '';
        onPlaceOrder({
            product,
            customerName: formData.name,
            phone: formData.phone,
            wilaya,
            municipality: formData.municipality,
            address: formData.address,
            deliveryFee,
            totalPrice: product.price + deliveryFee
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">طلب المنتج: {product.name}</h2>
                      <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl" aria-label="إغلاق">&times;</button>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-md mb-6 text-center">
                        <p className="text-lg">سعر المنتج: <span className="font-bold">{product.price.toLocaleString()} د.ج</span></p>
                        <p className="text-lg">سعر التوصيل: <span className="font-bold">{deliveryFee.toLocaleString()} د.ج</span></p>
                        <p className="text-xl text-indigo-600">السعر الإجمالي: <span className="font-bold">{(product.price + deliveryFee).toLocaleString()} د.ج</span></p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="text" placeholder="الاسم واللقب" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                        <input type="tel" placeholder="رقم الهاتف" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                        <select value={formData.wilayaId} onChange={handleWilayaChange} required className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-indigo-500 focus:border-indigo-500">
                            {ALGERIAN_WILAYAS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                        <input type="text" placeholder="البلدية" value={formData.municipality} onChange={e => setFormData({ ...formData, municipality: e.target.value })} required className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                        <input type="text" placeholder="العنوان الكامل" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                        <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-md hover:bg-indigo-700 transition-colors">تأكيد الطلب</button>
                    </form>
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
                      {product.images.map(img => (
                          <img key={img} src={img} onClick={() => setMainImage(img)} className={`w-20 h-20 rounded-md object-cover cursor-pointer border-2 transition-all ${mainImage === img ? 'border-indigo-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`} alt="thumbnail" />
                      ))}
                  </div>
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
                      <a href="tel:000000000" className="flex-1 flex items-center justify-center bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors">
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                        اتصل بنا
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

const AdminLogin: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const ADMIN_PASSWORD = 'admin123';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            onLogin();
        } else {
            setError('كلمة المرور غير صحيحة.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold text-center text-gray-800">تسجيل الدخول للوحة التحكم</h2>
                <p className="text-center text-gray-600">كلمة المرور الافتراضية هي: <code className="bg-gray-100 p-1 rounded font-mono">admin123</code></p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">كلمة المرور</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            required
                            className="w-full p-3 mt-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div>
                        <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-md hover:bg-indigo-700 transition-colors">
                            دخول
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<{notificationEmail: string}> = ({notificationEmail}) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">مرحباً بك في لوحة التحكم</h3>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
             <div className="flex">
                <div className="py-1 shrink-0"><svg className="h-6 w-6 text-blue-500 ml-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                <div>
                    <p className="font-bold">نظام استلام الطلبات</p>
                    <p className="text-sm">
                        هذا المتجر يعمل بدون قاعدة بيانات مركزية. لذلك، الطريقة الوحيدة والمضمونة لاستلام طلبات زبائنك هي عبر بريدك الإلكتروني.
                    </p>
                    {notificationEmail ? (
                        <p className="text-sm mt-2">
                            جميع الطلبات الجديدة سيتم إرسالها إلى: <strong className="font-mono">{notificationEmail}</strong>.
                            <br/>
                            الرجاء تفقد بريدك الإلكتروني بانتظام لمتابعة الطلبات.
                        </p>
                    ) : (
                         <p className="text-sm mt-2 text-red-600 font-semibold">
                            الرجاء الذهاب إلى "إعدادات الإشعارات" وتحديد بريدك الإلكتروني لبدء استلام الطلبات.
                        </p>
                    )}
                </div>
            </div>
        </div>
    </div>
);

const AdminProducts: React.FC<{products: Product[], setProducts: React.Dispatch<React.SetStateAction<Product[]>>}> = ({products, setProducts}) => {
    const initialFormState = {id: null, name: '', description: '', price: 0, category: ProductCategory.Other, images: ['']};
    const [form, setForm] = useState<Omit<Product, 'id'> & {id: number | null}>(initialFormState);
    const isEditing = form.id !== null;

    const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      const images = form.images[0].split(',').map(s => s.trim()).filter(Boolean);
       if (images.length === 0) {
        alert("الرجاء إضافة رابط صورة واحد على الأقل.");
        return;
      }
      if (form.id) { // Editing
        setProducts(products.map(p => p.id === form.id ? {...form, id: form.id, images} : p));
      } else { // Adding
        setProducts([...products, {...form, id: new Date().getTime(), images}]);
      }
      setForm(initialFormState); // Reset form
    }
    const handleEdit = (product: Product) => {
      setForm({...product, images: [product.images.join(', ')]});
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    }
    const handleDelete = (id: number) => {
      if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        setProducts(products.filter(p => p.id !== id));
      }
    };
    const resetForm = () => setForm(initialFormState);

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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">روابط الصور</label>
                  <input value={form.images[0]} onChange={e => setForm({...form, images: [e.target.value]})} placeholder="الصق رابط الصورة هنا، افصل بين الروابط بفاصلة" className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required />
                  <p className="text-xs text-gray-500 mt-1">لفصل صور متعددة، استخدم فاصلة ( , ). الصورة الأولى ستكون الصورة الرئيسية.</p>
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
        setDeliveryFees(deliveryFees.map(df => df.wilayaId === wilayaId ? {...df, fee: isNaN(fee) ? 0 : fee} : df));
    }
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">أسعار التوصيل</h3>
        <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mb-6 rounded-r-lg">
            <div className="flex">
                <div className="py-1"><svg className="h-6 w-6 text-indigo-500 ml-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                <div>
                    <p className="font-bold">تعديل أسعار التوصيل</p>
                    <p className="text-sm">قم بتحديد سعر التوصيل لكل ولاية. سيتم تطبيق السعر تلقائياً عند تقديم الزبون للطلب.</p>
                </div>
            </div>
        </div>
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

const AdminNotifications: React.FC<{email: string, setEmail: React.Dispatch<React.SetStateAction<string>>}> = ({email, setEmail}) => {
    const [tempEmail, setTempEmail] = useState(email);
    const [saved, setSaved] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setEmail(tempEmail);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">إعدادات الإشعارات</h3>
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
             <div className="flex">
                <div className="py-1"><svg className="h-6 w-6 text-green-500 ml-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                <div>
                    <p className="font-bold">خطوة هامة: استلام الطلبات عبر البريد</p>
                    <p className="text-sm">أدخل بريدك الإلكتروني هنا. عند كل طلب جديد، سيتم فتح تطبيق البريد لدى الزبون مع رسالة جاهزة لإرسالها إليك مباشرة. هذه هي الطريقة الوحيدة لاستلام الطلبات.</p>
                </div>
            </div>
        </div>
        <form onSubmit={handleSave} className="max-w-md space-y-4">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">البريد الإلكتروني لاستلام الطلبات</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    required
                    placeholder="example@email.com"
                    className="w-full p-3 mt-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            <div className="flex items-center space-x-4">
                <button type="submit" className="bg-indigo-600 text-white font-semibold px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm">
                    حفظ البريد
                </button>
                {saved && <p className="text-sm text-green-600">تم الحفظ بنجاح!</p>}
            </div>
        </form>
      </div>
    )
}

const AdminPage: React.FC<{ 
  products: Product[]; 
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  deliveryFees: DeliveryFee[];
  setDeliveryFees: React.Dispatch<React.SetStateAction<DeliveryFee[]>>;
  notificationEmail: string;
  setNotificationEmail: React.Dispatch<React.SetStateAction<string>>;
  onLogout: () => void;
}> = ({ products, setProducts, deliveryFees, setDeliveryFees, notificationEmail, setNotificationEmail, onLogout }) => {
    const [activeView, setActiveView] = useState('dashboard');

    const menuItems = [
      { id: 'dashboard', label: 'لوحة التحكم الرئيسية', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
      { id: 'products', label: 'إدارة المنتجات', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg> },
      { id: 'delivery', label: 'أسعار التوصيل', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-2h8a1 1 0 001-1zM21 11V5a2 2 0 00-2-2H9.572a2 2 0 00-1.414.586l-2.286 2.286A2 2 0 005 7.286V11m16 0a2 2 0 01-2 2h-1m-1-4l-3 3m0 0l-3-3m3 3V3"></path></svg> },
      { id: 'notifications', label: 'إعدادات الإشعارات', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> },
    ]

    return (
        <div className="flex flex-col md:flex-row bg-gray-100 rounded-lg shadow-lg min-h-[80vh]">
            {/* Sidebar */}
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
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        <span>تسجيل الخروج</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                {activeView === 'dashboard' && <AdminDashboard notificationEmail={notificationEmail} />}
                {activeView === 'products' && <AdminProducts products={products} setProducts={setProducts} />}
                {activeView === 'delivery' && <AdminDelivery deliveryFees={deliveryFees} setDeliveryFees={setDeliveryFees} />}
                {activeView === 'notifications' && <AdminNotifications email={notificationEmail} setEmail={setNotificationEmail} />}
            </main>
        </div>
    );
};


// ====================================================================
// ========================= MAIN APP COMPONENT =======================
// ====================================================================

const App: React.FC = () => {
  // State Management
  const [products, setProducts] = useLocalStorage<Product[]>('products', MOCK_PRODUCTS);
  const [deliveryFees, setDeliveryFees] = useLocalStorage<DeliveryFee[]>('delivery_fees', ALGERIAN_WILAYAS.map(w => ({ wilayaId: w.id, fee: 500 })));
  const [notificationEmail, setNotificationEmail] = useLocalStorage<string>('notification_email', '');

  // Routing State
  const [route, setRoute] = useState(window.location.hash);

  // Auth State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAdmin') === 'true';
  });

  // Order Modal State
  const [isOrderModalOpen, setOrderModalOpen] = useState(false);
  const [productToOrder, setProductToOrder] = useState<Product | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    sessionStorage.setItem('isAdmin', 'true');
  };
  
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('isAdmin');
    window.location.hash = '#/'; // Redirect to home
  };

  const handleOrderNow = (product: Product) => {
    setProductToOrder(product);
    setOrderModalOpen(true);
  };

  const handlePlaceOrder = (order: Omit<Order, 'id' | 'timestamp'>) => {
    setOrderModalOpen(false);

    if (!notificationEmail) {
        console.error("Owner's notification email is not set.");
        alert('تم تقديم طلبك بنجاح! سيتم التواصل معك قريباً. (ملاحظة لصاحب المتجر: لم يتم إرسال بريد إلكتروني لعدم تحديد إيميل الإشعارات في لوحة التحكم).');
        return;
    }

    const subject = `طلب جديد لمنتج: ${order.product.name}`;
    const body = `
مرحباً،

تم استلام طلب جديد بالتفاصيل التالية:

------------------------------------
**المنتج:** ${order.product.name}
**سعر المنتج:** ${order.product.price.toLocaleString()} د.ج
------------------------------------
**بيانات الزبون:**
**الاسم:** ${order.customerName}
**الهاتف:** ${order.phone}
**الولاية:** ${order.wilaya}
**البلدية:** ${order.municipality}
**العنوان:** ${order.address}
------------------------------------
**التكلفة:**
**سعر التوصيل:** ${order.deliveryFee.toLocaleString()} د.ج
**السعر الإجمالي:** ${order.totalPrice.toLocaleString()} د.ج
------------------------------------
    `;

    const mailtoLink = `mailto:${notificationEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    alert('شكراً لطلبك! سيتم الآن فتح تطبيق البريد الإلكتروني لإرسال تفاصيل الطلب. الرجاء الضغط على "إرسال" في تطبيق البريد لإتمام الطلب.');
    window.location.href = mailtoLink;
  };

  const renderPage = () => {
    const path = route.slice(1) || '/';

    if (path.startsWith('/product/')) {
        const id = parseInt(path.split('/')[2]);
        const product = products.find(p => p.id === id);
        return product ? <ProductPage product={product} onOrderNow={handleOrderNow} /> : <div className="text-center py-10">المنتج غير موجود</div>;
    }

    if (path === '/admin') {
        if (isAdminAuthenticated) {
            return <AdminPage 
              products={products} 
              setProducts={setProducts} 
              deliveryFees={deliveryFees} 
              setDeliveryFees={setDeliveryFees}
              notificationEmail={notificationEmail}
              setNotificationEmail={setNotificationEmail} 
              onLogout={handleAdminLogout} 
            />;
        } else {
            return <AdminLogin onLogin={handleAdminLogin} />;
        }
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
