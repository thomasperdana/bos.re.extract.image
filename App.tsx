
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import PropertyCard from './components/PropertyCard';
import { extractPropertyData } from './services/geminiService';
import { ExtractionResult } from './types';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await extractPropertyData(url);
      
      if (!data.property.images || data.property.images.length === 0) {
        throw new Error("No public image assets were detected. This usually happens with private listings, off-market homes, or highly protected listing pages.");
      }

      setResult(data);
    } catch (err: any) {
      console.error("Extraction Error:", err);
      setError(err.message || 'An unexpected error occurred during extraction.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = `property-photo-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = useCallback(() => {
    if (!result) return;
    const count = result.property.images.length;
    const confirmMsg = `Open ${count} high-res images in new tabs? You may need to allow pop-ups for this site.`;
    
    if (window.confirm(confirmMsg)) {
      result.property.images.forEach((img, idx) => {
        setTimeout(() => {
          handleDownloadImage(img.url, idx);
        }, idx * 400); 
      });
    }
  }, [result]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-100">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Search Section */}
        <section className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            High-Res <span className="text-blue-600">Asset</span> Discovery
          </h2>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Bypass listing protections. We search the entire web for high-resolution 
            photos of any property using Zillow, Redfin, or just the address.
          </p>

          <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="Paste URL or Type Address (e.g. 123 Main St, NYC)"
                className="flex-grow px-6 py-5 rounded-2xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xl text-lg transition-all"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-bold shadow-2xl shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sourcing...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Discover
                  </>
                )}
              </button>
            </div>
          </form>
          
          {error && (
            <div className="mt-8 p-8 bg-red-50 text-red-900 rounded-3xl border border-red-100 flex flex-col items-center gap-4 animate-in slide-in-from-top-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg">No Images Found</h4>
                <p className="text-sm opacity-80 max-w-md mx-auto">{error}</p>
              </div>
              <div className="pt-4 border-t border-red-100 w-full">
                <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Try this instead:</p>
                <button 
                  onClick={() => setUrl(url.split('/').pop()?.replace(/-/g, ' ') || url)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline"
                >
                  Search by Address Only
                </button>
              </div>
            </div>
          )}
        </section>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-blue-100 rounded-full"></div>
              <div className="w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 tracking-tight">Crawling Property CDNs</h3>
            <p className="text-gray-500 max-w-md mt-3 leading-relaxed font-medium">
              We are decoding the URL and scanning the web's public listing repositories to find every available high-res photo.
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
            <PropertyCard property={result.property} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-8">
              <div>
                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Full Gallery</h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">Found {result.property.images.length} unique high-fidelity images across platforms</p>
              </div>
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-2xl font-bold text-lg"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Save All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-10">
              {result.property.images.map((img, idx) => (
                <div key={idx} className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100">
                  <div className="relative aspect-[3/2] overflow-hidden bg-gray-50 cursor-zoom-in" onClick={() => window.open(img.url, '_blank')}>
                    <img
                      src={img.url}
                      alt={img.description || `Property image ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Protected+Asset';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur shadow-lg px-3 py-1.5 rounded-xl text-[11px] font-black text-blue-600 uppercase tracking-widest border border-white">
                      View {idx + 1}
                    </div>
                  </div>
                  <div className="p-5 flex items-center justify-between bg-white mt-auto border-t border-gray-50">
                    <p className="text-sm font-bold text-gray-800 truncate pr-4">
                      {img.description || "Listing Detail"}
                    </p>
                    <button
                      onClick={() => handleDownloadImage(img.url, idx)}
                      className="shrink-0 p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm"
                      title="Open full resolution"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] border border-blue-100 text-blue-900 text-sm flex gap-6 shadow-sm">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                 <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                 </svg>
               </div>
               <div className="space-y-1">
                 <p className="font-black text-base">Bulk Save Optimization</p>
                 <p className="opacity-70 leading-relaxed max-w-2xl">
                   We've scanned multiple listing aggregators to circumvent platform-specific blocking. 
                   Images are sourced directly from high-speed CDNs. For the best experience, please 
                   ensure your browser's <strong>pop-up blocker</strong> is disabled for this domain.
                 </p>
               </div>
            </div>

            {/* Sources grounding */}
            {result.sources.length > 0 && (
              <div className="mt-20 p-10 bg-gray-50 rounded-[3rem] border border-gray-200">
                <h4 className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[0.3em] flex items-center gap-3">
                  <span className="h-px bg-gray-200 flex-grow" />
                  Verified Data Repositories
                  <span className="h-px bg-gray-200 flex-grow" />
                </h4>
                <div className="flex flex-wrap justify-center gap-x-10 gap-y-5">
                  {result.sources.map((source, i) => (
                    <a
                      key={i}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-gray-500 hover:text-blue-600 flex items-center gap-2 group transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-blue-400 transition-colors" />
                      {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {!loading && !result && !error && (
          <div className="mt-24 flex flex-col items-center justify-center text-center">
            <div className="w-40 h-40 bg-gray-50 rounded-full flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-blue-50 rounded-full animate-ping opacity-20 scale-125" />
              <svg className="w-20 h-20 text-gray-300 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-400 max-w-sm leading-tight">
              Awaiting a listing link or property address for deep extraction.
            </p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-4 mb-8">
             <div className="px-4 py-1.5 bg-blue-50 rounded-full text-[10px] font-black text-blue-500 uppercase tracking-widest border border-blue-100">
               Gemini 3 Pro Core
             </div>
             <div className="px-4 py-1.5 bg-gray-50 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-200">
               Deep Discovery Logic
             </div>
          </div>
          <p className="text-sm font-medium text-gray-500 max-w-lg mx-auto leading-relaxed">
            PropView Extractor provides high-fidelity asset discovery for research and analysis. Please respect real estate data privacy and licensing.
          </p>
          <p className="mt-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
            &copy; {new Date().getFullYear()} Property Intelligence Group
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
