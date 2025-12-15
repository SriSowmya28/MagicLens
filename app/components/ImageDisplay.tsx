'use client';

interface ImageDisplayProps {
  originalImage: string | null;
  generatedImage: string | null;
  isGenerating: boolean;
}

export default function ImageDisplay({ 
  originalImage, 
  generatedImage, 
  isGenerating 
}: ImageDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Original Image */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
          Original
        </h3>
        <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          {originalImage ? (
            <img
              src={originalImage}
              alt="Original"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <p className="text-sm">No image uploaded</p>
            </div>
          )}
        </div>
      </div>

      {/* Generated Image */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Generated
        </h3>
        <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
          {isGenerating ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              {/* Loading Animation */}
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-violet-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-700">Generating with FIBO...</p>
                <p className="text-xs text-gray-500 mt-1">This may take a moment</p>
              </div>
            </div>
          ) : generatedImage ? (
            <>
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full h-full object-contain"
              />
              {/* Download Button */}
              <a
                href={generatedImage}
                download="fibo-generated.png"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 p-2 bg-white/80 hover:bg-white rounded-lg transition-colors shadow-md border border-gray-200"
                title="Download image"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Generated image will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// JSON Parameters Display component
interface ParamsDisplayProps {
  params: Record<string, unknown>;
  isProcessing?: boolean;
}

export function ParamsDisplay({ params, isProcessing }: ParamsDisplayProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          FIBO JSON Parameters
        </h3>
        {isProcessing && (
          <span className="flex items-center gap-1 text-xs text-violet-600">
            <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
            Processing...
          </span>
        )}
      </div>
      <pre className="p-4 text-xs text-gray-700 overflow-auto max-h-64 font-mono bg-gray-50">
        {JSON.stringify(params, null, 2)}
      </pre>
    </div>
  );
}
