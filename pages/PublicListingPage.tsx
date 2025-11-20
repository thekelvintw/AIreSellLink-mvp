
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ListingContext } from '../context/ListingContext';
import PageLayout from '../components/PageLayout';
import type { Contact } from '../types';

const getContactLink = (contact?: Contact | null) => {
    if (!contact) {
        return null; // 沒有聯絡方式就不要顯示
    }

    switch (contact.type) {
        case 'LINE':
            return {
                href: `https://line.me/ti/p/~${contact.value}`,
                label: `LINE：${contact.value}`,
            };
        case 'IG':
            return {
                href: `https://instagram.com/${contact.value}`,
                label: `IG：@${contact.value}`,
            };
        case 'Email':
            return {
                href: `mailto:${contact.value}`,
                label: `Email：${contact.value}`,
            };
        default:
            return null;
    }
}

const PublicListingPage: React.FC = () => {
    const context = useContext(ListingContext);
    if (!context) throw new Error("ListingContext not found");
    const [listingDraft] = context;
    const { slug } = useParams();

    const [storedListing, setStoredListing] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    // ✅ 嘗試從 localStorage 把對應 slug 的 listing 撈出來
    useEffect(() => {
        if (!slug) return;

        try {
            const raw = localStorage.getItem(`listing_${slug}`);
            if (raw) {
                setStoredListing(JSON.parse(raw));
            } else {
                setStoredListing(null);
            }
        } catch (e) {
            console.error("讀取 localStorage 失敗", e);
            setStoredListing(null);
        } finally {
            setLoading(false);
        }
    }, [slug]);

    // ✅ 統一用 listing 這個變數來畫畫面
    const listing = storedListing ?? listingDraft;

    if (loading) {
        return (
            <PageLayout>
                <div className="text-center py-20">
                    <p className="text-gray-600">載入中…</p>
                </div>
            </PageLayout>
        );
    }

    if (!listing) {
        return (
            <PageLayout>
                <div className="text-center py-20">
                    <h1 className="text-2xl font-bold mb-4">找不到商品</h1>
                    <p className="text-gray-600 mb-6">
                        這個連結可能已經失效，或是沒有對應的商品資料。
                    </p>
                    <Link to="/upload" className="bg-brand-dark text-white px-4 py-2 rounded">
                        建立我的商品頁
                    </Link>
                </div>
            </PageLayout>
        );
    }

    const { selectedLabel, enhancedImageUrl, price, copy, nickname, contact, selectedCopyStyle } = listing;
    const contactLink = getContactLink(contact);

    const displayText = selectedCopyStyle === 'brandStyle' ? copy?.brandStyle : copy?.resaleStyle;


    return (
        <PageLayout>
            <div className="space-y-6 pb-20">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {enhancedImageUrl ? (
                        <img src={enhancedImageUrl} alt={selectedLabel} className="w-full h-80 object-contain bg-brand-light" />
                    ) : (
                        <div className="w-full h-80 bg-gray-200 flex items-center justify-center text-gray-500">
                            圖片已過期
                        </div>
                    )}
                    <div className="p-6">
                        <h1 className="text-3xl font-bold text-brand-dark">{selectedLabel}</h1>
                        <p className="text-4xl font-bold text-brand-accent my-4">NT$ {price}</p>
                        <div className="prose prose-lg text-gray-700 whitespace-pre-wrap max-w-none">
                            <p>{displayText}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                    <p className="text-lg">聯絡賣家: <span className="font-bold">{nickname}</span></p>
                    {contactLink && (
                        <>
                            <p className="text-md text-gray-600 mt-2">{contactLink.label}</p>
                            <a 
                                href={contactLink.href} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="mt-4 inline-block w-full bg-green-500 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-600 transition-colors"
                            >
                                {contact?.type === 'Email' ? '傳送 Email' : `透過 ${contact?.type} 聯絡`}
                            </a>
                        </>
                    )}
                </div>
            </div>
             <footer className="text-center text-gray-400 text-sm py-4">
                由 <a href="#" onClick={e => e.preventDefault()} className="font-semibold text-gray-500 hover:underline">AI SellLink</a> 生成
            </footer>
        </PageLayout>
    );
};

export default PublicListingPage;
