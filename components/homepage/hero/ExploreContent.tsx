'use client';

import Image from 'next/image';
import Link from 'next/link';

interface ExploreItem {
  title: string;
  description: string;
  image: string;
  link: string;
}

const exploreItems: ExploreItem[] = [
  { title: 'Golconda Fort', description: 'Historic fortress with acoustic architecture', image: '/HYD/Golconda.png', link: 'https://en.wikipedia.org/wiki/Golconda_Fort' },
  { title: 'Hussain Sagar', description: 'Heart-shaped lake with Buddha statue', image: '/HYD/Hussian.png', link: 'https://en.wikipedia.org/wiki/Hussain_Sagar' },
  { title: 'Birla Mandir', description: 'White marble temple with city views', image: '/HYD/birlamandir.jpg', link: 'https://en.wikipedia.org/wiki/Birla_Mandir,_Hyderabad' },
  { title: 'Ramoji Film City', description: "World's largest integrated film studio", image: '/HYD/Ramoji.png', link: 'https://www.ramojifilmcity.com/' },
  { title: 'Salar Jung Museum', description: 'One of the largest one-man collections', image: '/HYD/Slarjung.png', link: 'https://en.wikipedia.org/wiki/Salar_Jung_Museum' },
  { title: 'HITEC City', description: "India's leading information technology hub", image: '/HYD/Hitec City.jpg', link: 'https://en.wikipedia.org/wiki/HITEC_City' },
];

function ExploreCardMobile({ item }: { item: ExploreItem }) {
  return (
    <Link 
      href={item.link} 
      target="_blank" 
      rel="noopener noreferrer"
      className="bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden border border-[#ebc975]/30 shadow-sm flex items-center hover:shadow-md transition-shadow"
    >
      <div className="relative w-14 h-14 flex-shrink-0">
        <Image src={item.image} alt={item.title} fill className="object-cover" sizes="56px" />
      </div>
      <div className="p-1.5 flex-1 min-w-0">
        <h3 className="text-xs font-bold text-[#25406b]">{item.title}</h3>
        <p className="text-[10px] text-[#25406b]/70 line-clamp-1">{item.description}</p>
      </div>
    </Link>
  );
}

function ExploreCardDesktop({ item }: { item: ExploreItem }) {
  return (
    <Link 
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden border border-[#ebc975]/30 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg w-full block"
    >
      <div className="relative h-20 lg:h-24 w-full">
        <Image src={item.image} alt={item.title} fill className="object-cover" sizes="200px" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <h3 className="absolute bottom-1 left-2 text-white font-bold text-sm drop-shadow-lg">{item.title}</h3>
      </div>
      <div className="p-2">
        <p className="text-xs text-[#25406b]/80 line-clamp-1">{item.description}</p>
      </div>
    </Link>
  );
}

export function ExploreContent() {
  const leftItems = exploreItems.slice(0, 3);
  const rightItems = exploreItems.slice(3, 6);
  const leftOffsets = [20, 0, 20];
  const rightOffsets = [-20, 0, -20];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Mobile layout - fully vertical, compact */}
      <div className="md:hidden flex flex-col h-full px-3">
        {/* Title - compact */}
        <h2 className="text-lg font-bold text-[#25406b] text-center pt-3">
          Explore <span className="text-[#852016]">Hyderabad</span>
        </h2>
        <p className="text-[10px] text-[#25406b]/70 text-center mb-1">
          Discover the City of Pearls
        </p>
        
        {/* Charminar space - reduced */}
        <div className="flex items-center justify-center h-[30vh]">
          <p className="text-[#852016]/5 text-xs">Charminar</p>
        </div>
        
        {/* Cards - vertical stack, compact */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pb-1">
          {exploreItems.map((item) => (
            <ExploreCardMobile key={item.title} item={item} />
          ))}
        </div>
        
        {/* Button */}
        <div className="py-2 text-center">
          <a href="/venue" className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#25406b] to-[#852016] text-white rounded-full font-semibold text-[11px]">
            Discover More
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
      
      {/* Desktop layout */}
      <div className="hidden md:flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl lg:text-3xl font-bold text-[#25406b] text-center mb-1">
          Explore <span className="text-[#852016]">Hyderabad</span>
        </h2>
        <p className="text-sm text-[#25406b]/70 text-center mb-4">
          Discover the City of Pearls - Rich heritage, modern marvels
        </p>
        
        <div className="w-full max-w-7xl grid grid-cols-[200px_1fr_200px] lg:grid-cols-[220px_1fr_220px] gap-4 px-4">
          <div className="flex flex-col justify-center gap-3">
            {leftItems.map((item, index) => (
              <div key={item.title} style={{ transform: `translateX(${leftOffsets[index]}px)` }}>
                <ExploreCardDesktop item={item} />
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center pointer-events-none">
            <div className="w-full aspect-square max-w-[350px] flex items-center justify-center">
              <p className="text-[#852016]/5 text-xs">Charminar</p>
            </div>
          </div>
          
          <div className="flex flex-col justify-center gap-3">
            {rightItems.map((item, index) => (
              <div key={item.title} style={{ transform: `translateX(${rightOffsets[index]}px)` }}>
                <ExploreCardDesktop item={item} />
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <a href="/venue" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#25406b] to-[#852016] text-white rounded-full font-semibold text-xs hover:shadow-lg transition-all hover:scale-105">
            Discover More
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

export default ExploreContent;
