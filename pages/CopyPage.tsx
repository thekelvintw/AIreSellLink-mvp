import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ListingContext } from '../context/ListingContext';
import { generateCopy } from '../services/geminiService';
import PageLayout from '../components/PageLayout';
import Button from '../components/Button';

const ImagePreview: React.FC<{ originalSrc: string, enhancedSrc: string, isLoading: boolean }> = ({ originalSrc, enhancedSrc, isLoading }) => {
    const [showEnhanced, setShowEnhanced] = useState(true);

    return (
        <div className="bg-white rounded-xl shadow-md p-4">
            <div className="relative w-full h-64">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-100 rounded-lg">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-dark"></div>
                        <p className="mt-3 text-gray-500">圖片處理中...</p>
                    </div>
                ) : (
                    <img src={showEnhanced ? enhancedSrc : originalSrc} alt="Product" className="w-full h-full object-contain rounded-lg" />
                )}
            </div>
            {!isLoading && enhancedSrc !== originalSrc && (
                <div className="mt-4 flex justify-center">
                    <button onClick={() => setShowEnhanced(!showEnhanced)} className="text-sm font-semibold text-brand-accent hover:underline">
                        {showEnhanced ? '顯示原圖' : '顯示去背圖'}
                    </button>
                </div>
            )}
        </div>
    );
};

interface CopyTabsProps {
  copy: { brandStyle: string; resaleStyle: string };
  onCopyChange: (type: 'brandStyle' | 'resaleStyle', value: string) => void;
  isLoading: boolean;
  activeTab: 'brandStyle' | 'resaleStyle';
  setActiveTab: (tab: 'brandStyle' | 'resaleStyle') => void;
}

const CopyTabs: React.FC<CopyTabsProps> = ({ copy, onCopyChange, isLoading, activeTab, setActiveTab }) => {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-md p-6 space-y-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
        );
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onCopyChange(activeTab, e.target.value);
    };

    const currentText = activeTab === 'resaleStyle' ? copy.resaleStyle : copy.brandStyle;

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="flex border-b">
                <button onClick={() => setActiveTab('resaleStyle')} className={`flex-1 py-3 text-center font-semibold transition-colors ${activeTab === 'resaleStyle' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-500 hover:bg-gray-50'}`}>轉售風格</button>
                <button onClick={() => setActiveTab('brandStyle')} className={`flex-1 py-3 text-center font-semibold transition-colors ${activeTab === 'brandStyle' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-500 hover:bg-gray-50'}`}>品牌風格</button>
            </div>
            <textarea
                value={currentText}
                onChange={handleTextChange}
                className="w-full p-6 bg-white text-brand-dark min-h-[200px] border-0 focus:ring-2 focus:ring-inset focus:ring-brand-accent resize-y"
                aria-label={activeTab === 'resaleStyle' ? "轉售風格文案" : "品牌風格文案"}
            />
        </div>
    );
};


const CopyPage: React.FC = () => {
    const context = useContext(ListingContext);
    if (!context) throw new Error("ListingContext not found");
    const [listingDraft, setListingDraft] = context;
    
    const [copy, setCopy] = useState({ brandStyle: '', resaleStyle: '' });
    const [isCopyLoading, setIsCopyLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'brandStyle' | 'resaleStyle'>('resaleStyle');

    const navigate = useNavigate();

    useEffect(() => {
        const fetchContent = async () => {
            if (listingDraft.selectedLabel && listingDraft.originalImage) {
                setIsCopyLoading(true);
                
                const detectionReason = listingDraft.candidates?.length
                    ? `AI 辨識候選：${listingDraft.candidates.slice(0, 3).join('、')}`
                    : '';

                generateCopy({
                    itemName: listingDraft.selectedLabel,
                    reason: detectionReason,
                    officialUrl: listingDraft.officialUrl ?? undefined,
                })
                .then(result => {
                    setCopy(result);
                })
                .catch((error) => {
                    console.error('Error generating copy via API:', error);
                })
                .finally(() => {
                    setIsCopyLoading(false);
                });
            }
        };
        fetchContent();
    }, [listingDraft.selectedLabel, listingDraft.originalImage, listingDraft.candidates, listingDraft.officialUrl]);

    if (!listingDraft.selectedLabel) {
        return <Navigate to="/detect" replace />;
    }

    const handleCopyChange = (type: 'brandStyle' | 'resaleStyle', value: string) => {
        setCopy(prev => ({
            ...prev,
            [type]: value,
        }));
    };

    const handleNext = () => {
        const computedImage =
            listingDraft.enhancedImageUrl ||
            (listingDraft.originalImage ? `data:image/png;base64,${listingDraft.originalImage.base64}` : undefined);

        setListingDraft(prev => ({ 
            ...prev, 
            copy, 
            enhancedImageUrl: computedImage,
            selectedCopyStyle: activeTab,
        }));
        navigate('/price');
    };

    const originalImageUrl = URL.createObjectURL(listingDraft.originalImage!.file);
    const processedImageUrl =
        listingDraft.enhancedImageUrl ||
        (listingDraft.originalImage ? `data:image/png;base64,${listingDraft.originalImage.base64}` : originalImageUrl);

    const isNextDisabled = isCopyLoading || (!copy.brandStyle && !copy.resaleStyle);

    return (
        <PageLayout>
            <div className="space-y-6">
                 <div>
                    <h1 className="text-2xl font-bold">文案與圖片</h1>
                    <p className="text-gray-500 mt-1">AI 已生成文案，您可以直接點擊編輯！</p>
                </div>
                <ImagePreview originalSrc={originalImageUrl} enhancedSrc={processedImageUrl} isLoading={false} />
                <CopyTabs 
                    copy={copy} 
                    onCopyChange={handleCopyChange} 
                    isLoading={isCopyLoading}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
                <Button label="下一步" onClick={handleNext} disabled={isNextDisabled} />
            </div>
        </PageLayout>
    );
};

export default CopyPage;