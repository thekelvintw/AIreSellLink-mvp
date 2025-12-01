
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ListingContext } from '../context/ListingContext';
import PageLayout from '../components/PageLayout';
import Button from '../components/Button';
import { detectItemFromFile } from '../services/geminiService';

const CandidatesList: React.FC<{ candidates: string[], selected: string, onSelect: (label: string) => void }> = ({ candidates, selected, onSelect }) => {
    return (
        <div className="space-y-3">
            {candidates.map((label) => (
                <label key={label} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${selected === label ? 'bg-orange-100 border-brand-accent ring-2 ring-brand-accent' : 'bg-white border-gray-200'}`}>
                    <input
                        type="radio"
                        name="candidate"
                        value={label}
                        checked={selected === label}
                        onChange={() => onSelect(label)}
                        className="h-5 w-5 text-brand-accent focus:ring-brand-accent border-gray-300"
                    />
                    <span className="ml-4 text-lg font-medium text-brand-dark">{label}</span>
                </label>
            ))}
        </div>
    );
};

const DetectPage: React.FC = () => {
  const context = useContext(ListingContext);
  if (!context) throw new Error("ListingContext not found");
  const [listingDraft, setListingDraft] = context;
  
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [officialUrl, setOfficialUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [detectError, setDetectError] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!listingDraft.originalImage?.file) return;
        setIsLoading(true);
      try {
        const result = await detectItemFromFile(listingDraft.originalImage.file);
        setCandidates(result);
        setSelectedLabel(result[0] ?? '');
        setDetectError(false);
      } catch (error) {
        console.warn('AI 辨識失敗，改用 fallback', error);
        setDetectError(true);
        setCandidates([]);
        setSelectedLabel('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, [listingDraft.originalImage]);

  if (!listingDraft.originalImage) {
    return <Navigate to="/upload" replace />;
  }

  const handleNext = () => {
    setListingDraft(prev => ({
        ...prev,
        candidates,
        selectedLabel,
        officialUrl: officialUrl || null
    }));
    navigate('/copy');
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <img src={URL.createObjectURL(listingDraft.originalImage.file)} alt="Uploaded product" className="rounded-xl object-cover w-full h-64 mx-auto" />
        
        {isLoading ? (
            <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark mx-auto"></div>
                <p className="mt-4 text-gray-600">AI 辨識中...</p>
            </div>
        ) : (
            <div className="space-y-6">
                {detectError ? (
                  <div className="space-y-3">
                    <h2 className="text-xl font-bold">AI 辨識暫時無法使用</h2>
                    <p className="text-sm text-gray-600">
                      請直接輸入商品名稱，系統會照常繼續下個步驟。
                    </p>
                    <input
                      type="text"
                      value={selectedLabel}
                      onChange={(e) => setSelectedLabel(e.target.value)}
                      placeholder="輸入商品名稱"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                    />
                  </div>
                ) : (
                  <div>
                      <h2 className="text-xl font-bold mb-2">AI 辨識結果</h2>
                      <p className="text-sm text-gray-600 mb-2">
                          根據圖片顯示的品牌標誌和產品外觀，最接近的商品名稱是：
                      </p>
                      <CandidatesList candidates={candidates} selected={selectedLabel} onSelect={setSelectedLabel} />
                  </div>
                )}
                <div>
                    <h2 className="text-xl font-bold mb-2">官網連結 (選填)</h2>
                    <p className="text-gray-500 mb-4">提供連結能生成更精準的文案</p>
                    <input 
                        type="url"
                        value={officialUrl}
                        onChange={(e) => setOfficialUrl(e.target.value)}
                        placeholder="輸入官網連結"
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-brand-accent focus:border-brand-accent bg-brand-dark text-white placeholder-gray-400"
                    />
                </div>
            </div>
        )}

        <Button label="下一步" onClick={handleNext} disabled={isLoading || !selectedLabel.trim()} />
      </div>
    </PageLayout>
  );
};

export default DetectPage;
