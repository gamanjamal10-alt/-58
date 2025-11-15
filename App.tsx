import React, { useState, useEffect, useCallback } from 'react';
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

// ========= MAIN APP COMPONENT =========
const App: React.FC = () => {
  // State Management
  const [products, setProducts] = useLocalStorage<Product[]>('products', MOCK_PRODUCTS);
  const [orders, setOrders] = useLocalStorage<Order[]>('orders', []);
  const [deliveryFees, setDeliveryFees] = useLocalStorage<DeliveryFee[]>('delivery_fees', ALGERIAN_WILAYAS.map(w => ({ wilayaId: w.id, fee: 500 })));

  // Routing State
  const [page, setPage] = useState<{ name: 'home' } | { name: 'product'; id: number } | { name: 'admin' }>({ name: 'home' });

  // Order Modal State
  const [isOrderModalOpen, setOrderModalOpen] = useState(false);
  const [productToOrder, setProductToOrder] = useState<Product | null>(null);

  const navigateTo = (p: typeof page) => {
    setPage(p);
    window.scrollTo(0, 0);
  };
  
  const handleOrderNow = (product: Product) => {
    setProductToOrder(product);
    setOrderModalOpen(true);
  };

  const handlePlaceOrder = (order: Omit<Order, 'id' | 'timestamp'>) => {
    const newOrder: Order = {
      ...order,
      id: `order_${new Date().getTime()}`,
      timestamp: new Date(),
    };
    setOrders(prevOrders => [newOrder, ...prevOrders]);
    setOrderModalOpen(false);
    alert('تم استلام طلبك بنجاح! سنتصل بك قريباً للتأكيد.');
  };

  const renderPage = () => {
    switch (page.name) {
      case 'home':
        return <HomePage products={products} navigateTo={navigateTo} />;
      case 'product':
        const product = products.find(p => p.id === page.id);
        return product ? <ProductPage product={product} onOrderNow={handleOrderNow} /> : <div>المنتج غير موجود</div>;
      case 'admin':
        return <AdminPage products={products} setProducts={setProducts} orders={orders} deliveryFees={deliveryFees} setDeliveryFees={setDeliveryFees} />;
      default:
        return <HomePage products={products} navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header navigateTo={navigateTo} />
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


// ========= COMPONENTS =========
const Header: React.FC<{ navigateTo: (page: any) => void }> = ({ navigateTo }) => (
  <header className="bg-white shadow-md sticky top-0 z-50">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <h1 onClick={() => navigateTo({ name: 'home' })} className="text-2xl font-bold text-gray-800 cursor-pointer">متجري</h1>
      <nav>
        <a onClick={() => navigateTo({ name: 'home' })} className="text-gray-600 hover:text-blue-600 mx-4 cursor-pointer">الرئيسية</a>
        <a onClick={() => navigateTo({ name: 'admin' })} className="text-gray-600 hover:text-blue-600 mx-4 cursor-pointer">لوحة التحكم</a>
      </nav>
    </div>
  </header>
);

const Footer: React.FC = () => (
  <footer className="bg-white mt-12 py-6 border-t">
    <div className="container mx-auto text-center text-gray-500">
      <p>&copy; {new Date().getFullYear()} متجري. كل الحقوق محفوظة.</p>
    </div>
  </footer>
);

const ProductCard: React.FC<{ product: Product; navigateTo: (page: any) => void }> = ({ product, navigateTo }) => (
    <div onClick={() => navigateTo({ name: 'product', id: product.id })} className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform transform hover:-translate-y-1 group">
        <img className="w-full h-56 object-cover group-hover:opacity-90" src={product.images[0]} alt={product.name} />
        <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
            <p className="text-blue-600 font-bold text-xl mt-2">{product.price.toLocaleString()} د.ج</p>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full mt-2 inline-block">{product.category}</span>
        </div>
    </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-800">طلب المنتج: {product.name}</h2>
                      <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl" aria-label="إغلاق">&times;</button>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-md mb-4 text-center">
                        <p className="text-lg">سعر المنتج: <span className="font-bold">{product.price.toLocaleString()} د.ج</span></p>
                        <p className="text-lg">سعر التوصيل: <span className="font-bold">{deliveryFee.toLocaleString()} د.ج</span></p>
                        <p className="text-xl text-blue-600">السعر الإجمالي: <span className="font-bold">{(product.price + deliveryFee).toLocaleString()} د.ج</span></p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="text" placeholder="الاسم واللقب" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full p-3 border rounded-md" />
                        <input type="tel" placeholder="رقم الهاتف" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required className="w-full p-3 border rounded-md" />
                        <select value={formData.wilayaId} onChange={handleWilayaChange} required className="w-full p-3 border rounded-md bg-white">
                            {ALGERIAN_WILAYAS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                        <input type="text" placeholder="البلدية" value={formData.municipality} onChange={e => setFormData({ ...formData, municipality: e.target.value })} required className="w-full p-3 border rounded-md" />
                        <input type="text" placeholder="العنوان الكامل" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required className="w-full p-3 border rounded-md" />
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 transition-colors">تأكيد الطلب</button>
                    </form>
                </div>
            </div>
        </div>
    );
};


// ========= PAGES =========
const HomePage: React.FC<{ products: Product[]; navigateTo: (page: any) => void }> = ({ products, navigateTo }) => {
  const [filter, setFilter] = useState<ProductCategory | 'all'>('all');
  const categories: ('all' | ProductCategory)[] = ['all', ...Object.values(ProductCategory)];
  const filteredProducts = filter === 'all' ? products : products.filter(p => p.category === filter);

  return (
    <div>
        <div className="bg-blue-600 text-white text-center py-16 rounded-lg shadow-lg mb-8">
            <h2 className="text-4xl font-extrabold">مرحباً بك في متجري</h2>
            <p className="mt-4 text-lg">أفضل المنتجات بأفضل الأسعار، تصلك أينما كنت في الجزائر</p>
        </div>
        
        <div className="mb-8 text-center">
            {categories.map(cat => (
                <button 
                    key={cat} 
                    onClick={() => setFilter(cat)}
                    className={`px-4 py-2 mx-1 my-1 rounded-full font-semibold transition-colors ${filter === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
                >
                    {cat === 'all' ? 'الكل' : cat}
                </button>
            ))}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(p => <ProductCard key={p.id} product={p} navigateTo={navigateTo} />)}
        </div>
    </div>
  );
};


const ProductPage: React.FC<{ product: Product; onOrderNow: (product: Product) => void }> = ({ product, onOrderNow }) => {
  const [mainImage, setMainImage] = useState(product.images[0]);
  return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                  <img src={mainImage} alt={product.name} className="w-full h-auto rounded-lg object-cover mb-4 max-h-96" />
                  <div className="flex space-x-2 rtl:space-x-reverse">
                      {product.images.map(img => (
                          <img key={img} src={img} onClick={() => setMainImage(img)} className={`w-20 h-20 rounded-md object-cover cursor-pointer border-2 ${mainImage === img ? 'border-blue-500' : 'border-transparent'}`} alt="thumbnail" />
                      ))}
                  </div>
              </div>
              <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h2>
                  <p className="text-3xl font-bold text-blue-600 mb-4">{product.price.toLocaleString()} د.ج</p>
                  <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 sm:rtl:space-x-reverse">
                      <button onClick={() => onOrderNow(product)} className="flex-1 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">اطلب الآن</button>
                      <a href="https://wa.me/213000000000" target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors">تواصل عبر واتساب</a>
                      <a href="tel:000000000" className="flex-1 text-center bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors">اتصل بنا</a>
                  </div>
              </div>
          </div>
      </div>
  );
};

const AdminPage: React.FC<{ 
  products: Product[]; 
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  deliveryFees: DeliveryFee[];
  setDeliveryFees: React.Dispatch<React.SetStateAction<DeliveryFee[]>>;
}> = ({ products, setProducts, orders, deliveryFees, setDeliveryFees }) => {
    const [activeTab, setActiveTab] = useState('products');

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold mb-6">لوحة التحكم</h2>
            <div className="border-b mb-6">
                <nav className="flex space-x-4 rtl:space-x-reverse">
                    <button onClick={() => setActiveTab('products')} className={`py-2 px-4 font-semibold ${activeTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>إدارة المنتجات</button>
                    <button onClick={() => setActiveTab('orders')} className={`py-2 px-4 font-semibold ${activeTab === 'orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>الطلبات ({orders.length})</button>
                    <button onClick={() => setActiveTab('delivery')} className={`py-2 px-4 font-semibold ${activeTab === 'delivery' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>أسعار التوصيل</button>
                </nav>
            </div>
            {activeTab === 'products' && <AdminProducts products={products} setProducts={setProducts} />}
            {activeTab === 'orders' && <AdminOrders orders={orders} />}
            {activeTab === 'delivery' && <AdminDelivery deliveryFees={deliveryFees} setDeliveryFees={setDeliveryFees} />}
        </div>
    );
};

// Admin Sub-components
const AdminProducts: React.FC<{products: Product[], setProducts: React.Dispatch<React.SetStateAction<Product[]>>}> = ({products, setProducts}) => {
    // A simplified form for add/edit product
    const [form, setForm] = useState<Omit<Product, 'id'> & {id: number | null}>({id: null, name: '', description: '', price: 0, category: ProductCategory.Other, images: ['']});

    const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      const images = form.images[0].split(',').map(s => s.trim()).filter(Boolean);
      if (form.id) { // Edit
        setProducts(products.map(p => p.id === form.id ? {...form, id: form.id, images} : p));
      } else { // Add
        setProducts([...products, {...form, id: new Date().getTime(), images}]);
      }
      setForm({id: null, name: '', description: '', price: 0, category: ProductCategory.Other, images: ['']}); // Reset
    }
    const handleEdit = (product: Product) => setForm({...product, images: [product.images.join(', ')]});
    const handleDelete = (id: number) => setProducts(products.filter(p => p.id !== id));

    return <div>
        <form onSubmit={handleSave} className="mb-8 p-4 border rounded-lg space-y-4">
            <h3 className="text-xl font-semibold">{form.id ? 'تعديل منتج' : 'إضافة منتج جديد'}</h3>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="اسم المنتج" className="w-full p-2 border rounded" required />
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="وصف المنتج" className="w-full p-2 border rounded" required />
            <input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} placeholder="السعر" className="w-full p-2 border rounded" required />
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value as ProductCategory})} className="w-full p-2 border rounded bg-white">
                {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={form.images[0]} onChange={e => setForm({...form, images: [e.target.value]})} placeholder="روابط الصور (مفصولة بفاصلة)" className="w-full p-2 border rounded" required />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">حفظ المنتج</button>
        </form>
        <div className="space-y-4">
            {products.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span>{p.name}</span>
                    <div>
                        <button onClick={() => handleEdit(p)} className="bg-yellow-500 text-white px-3 py-1 rounded mx-1">تعديل</button>
                        <button onClick={() => handleDelete(p.id)} className="bg-red-500 text-white px-3 py-1 rounded mx-1">حذف</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
}

const AdminOrders: React.FC<{orders: Order[]}> = ({orders}) => (
    <div>
        {orders.length === 0 ? <p>لا توجد طلبات حالياً.</p> :
        <div className="space-y-4">
            {orders.map(order => (
                <div key={order.id} className="p-4 border rounded-lg">
                    <p><strong>المنتج:</strong> {order.product.name}</p>
                    <p><strong>الزبون:</strong> {order.customerName} - <strong>الهاتف:</strong> {order.phone}</p>
                    <p><strong>العنوان:</strong> {order.wilaya}, {order.municipality}, {order.address}</p>
                    <p><strong>السعر الإجمالي:</strong> {order.totalPrice.toLocaleString()} د.ج (شامل التوصيل)</p>
                    <p className="text-sm text-gray-500">تاريخ الطلب: {new Date(order.timestamp).toLocaleString()}</p>
                </div>
            ))}
        </div>}
    </div>
)

const AdminDelivery: React.FC<{deliveryFees: DeliveryFee[], setDeliveryFees: React.Dispatch<React.SetStateAction<DeliveryFee[]>>}> = ({deliveryFees, setDeliveryFees}) => {
    const handleFeeChange = (wilayaId: number, fee: number) => {
        setDeliveryFees(deliveryFees.map(df => df.wilayaId === wilayaId ? {...df, fee: isNaN(fee) ? 0 : fee} : df));
    }
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALGERIAN_WILAYAS.map(w => {
            const fee = deliveryFees.find(df => df.wilayaId === w.id)?.fee ?? 0;
            return (
                <div key={w.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <label htmlFor={`fee-${w.id}`}>{w.name}</label>
                    <input id={`fee-${w.id}`} type="number" value={fee} onChange={e => handleFeeChange(w.id, parseInt(e.target.value))} className="w-24 p-1 border rounded" />
                </div>
            )
        })}
    </div>
}


export default App;
