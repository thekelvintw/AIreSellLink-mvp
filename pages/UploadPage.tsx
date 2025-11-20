
import React, { useState, useContext, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListingContext } from '../context/ListingContext';
import { fileToBase64 } from '../utils/fileUtils';
import PageLayout from '../components/PageLayout';
import Button from '../components/Button';

const UploadCard: React.FC<{ onUpload: (file: File, previewUrl: string) => void }> = ({ onUpload }) => {
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
          {preview ? (
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
      <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
};


const UploadPage: React.FC = () => {
  const context = useContext(ListingContext);
  if (!context) throw new Error("ListingContext not found");
  const [, setListingDraft] = context;

  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const handleUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
  };

  const handleNext = async () => {
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setListingDraft(prev => ({ ...prev, originalImage: { file, base64 } }));
        navigate('/detect');
      } catch (error) {
        console.error("Error converting file to base64", error);
        // Add user-facing error toast here
      }
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-center">AI SellLink</h1>
        <p className="text-center text-gray-600">讓 AI 幫你賣東西，三分鐘生成二手賣場</p>
        <UploadCard onUpload={handleUpload} />
        <Button label="下一步" onClick={handleNext} disabled={!file} />
      </div>
    </PageLayout>
  );
};

export default UploadPage;
