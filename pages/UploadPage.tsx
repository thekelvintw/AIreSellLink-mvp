
import React, { useState, useContext, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListingContext } from '../context/ListingContext';
import { fileToBase64 } from '../utils/fileUtils';
import { removeBackground } from '../services/removeBgService';
import PageLayout from '../components/PageLayout';
import Button from '../components/Button';

const UploadCard: React.FC<{ 
  onUpload: (file: File, previewUrl: string) => void;
  isProcessing?: boolean;
  noBgUrl?: string | null;
}> = ({ onUpload, isProcessing, noBgUrl }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      onUpload(file, previewUrl);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 text-center">
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className={`w-full h-64 border-2 border-dashed rounded-lg flex flex-col justify-center items-center ${preview ? '' : 'hover:bg-gray-50'}`}>
          {isProcessing ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark mx-auto"></div>
              <p className="mt-4 text-gray-600">處理中...</p>
            </div>
          ) : noBgUrl ? (
            <img src={noBgUrl} alt="No background" className="w-full h-full object-contain rounded-lg bg-brand-light" />
          ) : preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <>
              <svg xmlns="http://www.w.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="mt-2 text-gray-600">上傳單張圖片</p>
              <p className="text-sm text-gray-400">拍照或選擇檔案</p>
            </>
          )}
        </div>
      </label>
      <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isProcessing} />
    </div>
  );
};


const UploadPage: React.FC = () => {
  const context = useContext(ListingContext);
  if (!context) throw new Error("ListingContext not found");
  const [, setListingDraft] = context;

  const [file, setFile] = useState<File | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noBgUrl, setNoBgUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setNoBgUrl(null);
    setError(null);
  };

  const handleRemoveBg = async () => {
    if (!file) return;
    
    setIsRemovingBg(true);
    setError(null);
    
    try {
      const url = await removeBackground(file);
      setNoBgUrl(url);
      
      // 將去背後的圖片轉為 base64 並存到 context
      const response = await fetch(url);
      const blob = await response.blob();
      const noBgFile = new File([blob], 'no-bg.png', { type: 'image/png' });
      const base64 = await fileToBase64(noBgFile);
      
      setListingDraft(prev => ({ 
        ...prev, 
        originalImage: { file, base64 },
        enhancedImageUrl: url
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '去背失敗');
      console.error("Remove background error:", err);
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleNext = async () => {
    if (file) {
      try {
        // 如果有去背後的圖片，使用它；否則使用原始圖片
        let imageToUse: string;
        let imageFile = file;
        
        if (noBgUrl) {
          const response = await fetch(noBgUrl);
          const blob = await response.blob();
          imageFile = new File([blob], 'no-bg.png', { type: 'image/png' });
          imageToUse = await fileToBase64(imageFile);
        } else {
          imageToUse = await fileToBase64(file);
        }
            
        setListingDraft(prev => ({ 
          ...prev, 
          originalImage: { file: imageFile, base64: imageToUse },
          enhancedImageUrl: noBgUrl || undefined
        }));
        navigate('/detect');
      } catch (error) {
        console.error("Error converting file to base64", error);
        setError('處理圖片時發生錯誤');
      }
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-center">AI SellLink</h1>
        <p className="text-center text-gray-600">讓 AI 幫你賣東西，三分鐘生成二手賣場</p>
        
        <UploadCard 
          onUpload={handleUpload} 
          isProcessing={isRemovingBg}
          noBgUrl={noBgUrl}
        />
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
            {error}
          </div>
        )}
        
        {file && !noBgUrl && !isRemovingBg && (
          <Button 
            label="去除背景" 
            onClick={handleRemoveBg} 
            disabled={isRemovingBg}
            variant="outline"
          />
        )}
        
        <Button 
          label="下一步" 
          onClick={handleNext} 
          disabled={!file || isRemovingBg} 
        />
      </div>
    </PageLayout>
  );
};

export default UploadPage;
