
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ListingContext } from '../context/ListingContext';
import { suggestPrice } from '../services/geminiService';
import PageLayout from '../components/PageLayout';
import type { Contact } from '../types';

const PriceInput: React.FC<{ hintMin: number, hintMax: number, value: string, onChange: (value: string) => void }> = ({ hintMin, hintMax, value, onChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-2">設定售價</h2>
        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">NT$</span>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent bg-white text-brand-dark placeholder-gray-400"
            />
        </div>
        <p className="text-center text-sm text-gray-500 mt-3">
            AI 建議售價區間: ${hintMin} - ${hintMax}
        </p>
    </div>
  );
};

const ContactPicker: React.FC<{ onNicknameChange: (val: string) => void, onContactChange: (contact: Contact) => void }> = ({ onNicknameChange, onContactChange }) => {
    const [contactType, setContactType] = useState<Contact['type']>('');
    
    return (
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h2 className="text-xl font-bold">聯絡方式</h2>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">你的暱稱</label>
                <input
                    type="text"
                    onChange={e => onNicknameChange(e.target.value)}
                    placeholder="王小明"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent bg-white text-brand-dark placeholder-gray-400"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">主要聯絡方式</label>
                <select 
                    value={contactType} 
                    onChange={e => {
                        setContactType(e.target.value as Contact['type']);
                        onContactChange({ type: e.target.value as Contact['type'], value: '' });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent bg-white text-brand-dark"
                >
                    <option value="">請選擇</option>
                    <option value="LINE">LINE ID</option>
                    <option value="IG">Instagram</option>
                    <option value="Email">Email</option>
                </select>
            </div>
            {contactType && (
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{contactType} 帳號</label>
                    <input
                        type={contactType === 'Email' ? 'email' : 'text'}
                        onChange={e => onContactChange({ type: contactType, value: e.target.value })}
                        placeholder={`請輸入您的 ${contactType}`}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent bg-white text-brand-dark placeholder-gray-400"
                    />
                </div>
            )}
        </div>
    );
};

const PricePage: React.FC = () => {
    const context = useContext(ListingContext);
    if (!context) throw new Error("ListingContext not found");
    const [listingDraft, setListingDraft] = context;
    
    const [priceHint, setPriceHint] = useState({ min: 0, max: 0 });
    const [price, setPrice] = useState('');
    const [nickname, setNickname] = useState('');
    const [contact, setContact] = useState<Contact>({ type: '', value: '' });
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchPriceHint = async () => {
            if (listingDraft.selectedLabel) {
                setIsLoading(true);
                const result = await suggestPrice(listingDraft.selectedLabel);
                setPriceHint(result);
                setIsLoading(false);
            }
        };
        fetchPriceHint();
    }, [listingDraft.selectedLabel]);

    if (!listingDraft.copy) {
        return <Navigate to="/copy" replace />;
    }

    const handleGenerate = () => {
        const slug = `${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
        setListingDraft(prev => ({
            ...prev,
            price: Number(price),
            nickname,
            contact,
            priceHint,
            shareSlug: slug,
        }));
        navigate(`/share/${slug}`);
    };

    const trimmedPrice = price.trim();
    const trimmedNickname = nickname.trim();
    // 只檢查真正必填的兩個欄位：價格和暱稱
    const isNextDisabled = !trimmedPrice || !trimmedNickname;

    return (
        <PageLayout>
            {isLoading ? (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark mx-auto"></div>
                    <p className="mt-4 text-gray-600">正在獲取價格建議...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold">價格與聯絡方式</h1>
                    <PriceInput hintMin={priceHint.min} hintMax={priceHint.max} value={price} onChange={setPrice} />
                    <ContactPicker onNicknameChange={setNickname} onContactChange={setContact} />
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isNextDisabled}
                        className={`w-full rounded-lg py-3 font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isNextDisabled
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-brand-dark text-white hover:bg-gray-800 focus:ring-brand-dark'
                        }`}
                    >
                        生成分享頁
                    </button>
                    {isNextDisabled && (
                        <p className="text-sm text-gray-500 text-center">
                            請先填寫售價與暱稱
                        </p>
                    )}
                </div>
            )}
        </PageLayout>
    );
};

export default PricePage;
