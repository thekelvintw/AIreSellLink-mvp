
import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ListingContext } from '../context/ListingContext';
import PageLayout from '../components/PageLayout';
import Button from '../components/Button';
import type { ListingDraft } from '../types';

const SharePreviewCard: React.FC<{ listingData: ListingDraft }> = ({ listingData }) => {
    const displayText = listingData.selectedCopyStyle === 'brandStyle' && listingData.copy
        ? listingData.copy.brandStyle
        : listingData.copy?.resaleStyle;

    let contactInfo = null;
    if (listingData.contact?.type && listingData.contact?.value) {
        const { type, value } = listingData.contact;
        let typeText = '';
        switch (type) {
            case 'LINE':
                typeText = 'LINE id';
                break;
            case 'IG':
                typeText = 'Instagram';
                break;
            case 'Email':
                typeText = 'Email';
                break;
        }
        if (typeText) {
            contactInfo = `${typeText} : ${value}`;
        }
    }


    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <img src={listingData.enhancedImageUrl} alt={listingData.selectedLabel} className="w-full h-60 object-contain bg-brand-light" />
            <div className="p-6">
                <h2 className="text-2xl font-bold text-brand-dark">{listingData.selectedLabel}</h2>
                <p className="text-3xl font-bold text-brand-accent my-3">NT$ {listingData.price}</p>
                <p className="text-gray-600 whitespace-pre-wrap">{displayText}</p>
                <div className="mt-6 border-t pt-4 text-center">
                    <p className="text-gray-700">由 <span className="font-semibold">{listingData.nickname}</span> 提供</p>
                    {contactInfo && <p className="text-gray-600 mt-1">{contactInfo}</p>}
                </div>
            </div>
        </div>
    );
};

const SharePage: React.FC = () => {
    const context = useContext(ListingContext);
    if (!context) throw new Error("ListingContext not found");
    const [listingDraft, setListingDraft] = context;
    const { slug } = useParams();
    const navigate = useNavigate();
    const [toastMessage, setToastMessage] = useState('');

    // ✅ 當 shareSlug 存在時，把整個 listingDraft 存到 localStorage
    useEffect(() => {
        if (!listingDraft.shareSlug) return;

        try {
            localStorage.setItem(
                `listing_${listingDraft.shareSlug}`,
                JSON.stringify(listingDraft)
            );
            console.log("已儲存 listing 到 localStorage：", listingDraft.shareSlug);
        } catch (e) {
            console.error("儲存到 localStorage 失敗", e);
        }
    }, [listingDraft]);

    // 修正網址生成邏輯，避免重複拼接 protocol
    const shareUrl = `${window.location.origin}${window.location.pathname}#/p/${slug}`;

    if (slug !== listingDraft.shareSlug || !listingDraft.shareSlug) {
      return <Navigate to="/upload" replace />;
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setToastMessage('連結已複製！');
            setTimeout(() => setToastMessage(''), 2000);
        });
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: listingDraft.selectedLabel,
                text: `來看看我用 AI SellLink 賣的「${listingDraft.selectedLabel}」`,
                url: shareUrl,
            });
        } else {
            handleCopy();
        }
    };
    
    const handleNewListing = () => {
      setListingDraft({});
      navigate('/upload');
    };

    return (
        <PageLayout>
            <div className="space-y-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h1 className="text-2xl font-bold">生成完成！</h1>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    注意：此為預覽版本，沒有後端資料庫。<br/>
                    連結僅在目前瀏覽器視窗有效，重新整理後即失效。
                </div>
                <SharePreviewCard listingData={listingDraft} />
                <div className="space-y-3 pt-4">
                    <Button label="一鍵分享" onClick={handleShare} variant="secondary" />
                    <Button label="複製連結" onClick={handleCopy} />
                    <Button label="再上架一件" onClick={handleNewListing} variant="outline" />
                </div>
            </div>
            {toastMessage && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-brand-dark text-white px-6 py-2 rounded-full shadow-lg">
                    {toastMessage}
                </div>
            )}
        </PageLayout>
    );
};

export default SharePage;
