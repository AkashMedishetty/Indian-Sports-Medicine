'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Navigation } from '@/conference-backend-core/components/Navigation';

interface Member {
  name: string;
  role?: string;
  initials: string;
  image?: string;
}

function MemberCard({ member, delay = 0 }: { member: Member; delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col items-center text-center"
    >
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-3 border-[#ebc975] shadow-md">
        {member.image ? (
          <Image src={member.image} alt={member.name} width={96} height={96} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#25406b] flex items-center justify-center">
            <span className="text-lg font-bold text-white">{member.initials}</span>
          </div>
        )}
      </div>
      <p className="text-sm font-semibold text-[#25406b] mt-2 leading-tight">{member.name}</p>
      {member.role && <p className="text-xs text-[#852016]">{member.role}</p>}
    </motion.div>
  );
}

export default function CommitteePage() {
  const isshBearers: Member[] = [
    { name: 'Dr G Karthikeyan', role: 'President', initials: 'GK', image: '/ISSH/karthikeyan.jpg' },
    { name: 'Dr Praveen Bhardwaj', role: 'Secretary', initials: 'PB', image: '/ISSH/praveen.jpg' },
    { name: 'Dr. Anil K Bhat', role: 'President Elect', initials: 'AB', image: '/ISSH/Anil-Bhat.jpg' },
  ];
  
  const tosaBearers: Member[] = [
    { name: 'Dr K Ram Kumar Reddy', role: 'President', initials: 'RK', image: '/ISSH/Ram kumar.jpg' },
    { name: 'Dr Jagan Mohan Reddy', role: 'Secretary', initials: 'JM', image: '/ISSH/jagan.jpg' },
    { name: 'Dr Alwal Reddy', role: 'President Elect', initials: 'AR', image: '/ISSH/alwal.jpg' },
  ];
  
  const tcosBearers: Member[] = [
    { name: 'Dr Raju Iyenger', role: 'President', initials: 'RI', image: '/ISSH/raju.jpg' },
    { name: 'Dr Suneel R', role: 'Secretary', initials: 'SR', image: '/ISSH/suneel.jpg' },
  ];

  const aprasBearers: Member[] = [
    { name: 'Dr Palukuri Lakshmi', role: 'President', initials: 'PL', image: '/ISSH/Dr Palukuri Lakshmi.jpg' },
    { name: 'Dr Duggirala Prathap', role: 'General Secretary', initials: 'DP', image: '/ISSH/Dr Duggirala Prathap.jpg' },
  ];

  const orgChairs: Member[] = [
    { name: 'Prof MV Reddy', role: 'Organising Chairman', initials: 'MR', image: '/ISSH/mv reddy.jpg' },
    { name: 'Dr Gopinath Bandari', role: 'Organising Secretary', initials: 'GB', image: '/ISSH/gopi.png' },
    { name: 'Dr Sandeep Sriram', role: 'Treasurer', initials: 'SS', image: '/ISSH/sandeep sriram.jpeg' },
  ];

  const scientific: Member[] = [
    { name: 'Dr Deepthinandan Reddy', initials: 'DR', image: '/ISSH/deepthinandan.jpeg' },
    { name: 'Dr Suneel R', initials: 'SR', image: '/ISSH/suneel.jpg' },
    { name: 'Dr Manesh Jain', initials: 'MJ', image: '/ISSH/manish.jpeg' },
  ];
  
  const trade: Member[] = [
    { name: 'Dr Sandeep Sriram', initials: 'SS', image: '/ISSH/sandeep sriram.jpeg' },
    { name: 'Dr Sujit Kumar Vakati', initials: 'SV', image: '/ISSH/sujit.jpeg' },
  ];
  
  const travel: Member[] = [
    { name: 'Dr Avinash', initials: 'AV', image: '/ISSH/Avinash.jpeg' },
    { name: 'Dr Krishna Sandeep', initials: 'KS', image: '/ISSH/krishna sandeep.jpeg' },
  ];
  
  const registration: Member[] = [
    { name: 'Dr Sahithya B', initials: 'SB', image: '/ISSH/sahitya.jpeg' },
    { name: 'Dr Minal', initials: 'DM', image: '/ISSH/minal.jpeg' },
  ];
  
  const food: Member[] = [
    { name: 'Dr Sujit Kumar Vakati', initials: 'SV', image: '/ISSH/sujit.jpeg' },
    { name: 'Dr Akkidas Dheeraj', initials: 'AD', image: '/ISSH/akkidas.jpeg' },
  ];
  
  const banquet: Member[] = [
    { name: 'Dr Sandeep Sriram', initials: 'SS', image: '/ISSH/sandeep sriram.jpeg' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <Navigation />

      {/* Header */}
      <section className="pt-24 pb-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[#852016] text-sm uppercase tracking-widest mb-2">ISSH Midterm CME 2026</p>
          <h1 className="text-3xl md:text-5xl font-bold text-[#25406b]">
            Organising Committee
          </h1>
          <div className="w-16 h-1 bg-[#ebc975] mx-auto mt-4" />
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-16">
        
        {/* Organising Committee - Featured */}
        <section className="mb-12">
          <h2 className="text-center text-sm font-bold text-[#852016] uppercase tracking-wider mb-6">
            Organising Committee
          </h2>
          <div className="flex justify-center gap-8 md:gap-12 flex-wrap">
            {orgChairs.map((m, i) => (
              <MemberCard key={m.name} member={m} delay={i * 0.1} />
            ))}
          </div>
        </section>

        {/* Office Bearers Grid */}
        <section className="mb-12">
          <h2 className="text-center text-sm font-bold text-[#852016] uppercase tracking-wider mb-6">
            Office Bearers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* ISSH */}
            <div className="bg-white/60 rounded-xl p-4 text-center">
              <h3 className="text-xs font-bold text-[#25406b] mb-4 pb-2 border-b border-[#ebc975]/50">ISSH</h3>
              <div className="flex flex-col items-center gap-4">
                {isshBearers.map((m, i) => (
                  <MemberCard key={m.name} member={m} delay={i * 0.05} />
                ))}
              </div>
            </div>
            
            {/* TOSA */}
            <div className="bg-white/60 rounded-xl p-4 text-center">
              <h3 className="text-xs font-bold text-[#25406b] mb-4 pb-2 border-b border-[#ebc975]/50">TOSA</h3>
              <div className="flex flex-col items-center gap-4">
                {tosaBearers.map((m, i) => (
                  <MemberCard key={m.name} member={m} delay={i * 0.05} />
                ))}
              </div>
            </div>
            
            {/* TCOS */}
            <div className="bg-white/60 rounded-xl p-4 text-center">
              <h3 className="text-xs font-bold text-[#25406b] mb-4 pb-2 border-b border-[#ebc975]/50">TCOS</h3>
              <div className="flex flex-col items-center gap-4">
                {tcosBearers.map((m, i) => (
                  <MemberCard key={m.name} member={m} delay={i * 0.05} />
                ))}
              </div>
            </div>
            
            {/* APRAS */}
            <div className="bg-white/60 rounded-xl p-4 text-center">
              <h3 className="text-xs font-bold text-[#25406b] mb-4 pb-2 border-b border-[#ebc975]/50">APRAS AP & TG</h3>
              <div className="flex flex-col items-center gap-4">
                {aprasBearers.map((m, i) => (
                  <MemberCard key={m.name} member={m} delay={i * 0.05} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Sub-Committees */}
        <section>
          <h2 className="text-center text-sm font-bold text-[#852016] uppercase tracking-wider mb-6">
            Sub-Committees
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Scientific */}
            <div className="bg-white/60 rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#25406b] mb-3 text-center">Scientific</h3>
              <div className="flex justify-center gap-3 flex-wrap">
                {scientific.map((m, i) => (
                  <MemberCard key={m.name} member={m} delay={i * 0.05} />
                ))}
              </div>
            </div>
            
            {/* Trade */}
            <div className="bg-white/60 rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#25406b] mb-3 text-center">Trade</h3>
              <div className="flex justify-center gap-3 flex-wrap">
                {trade.map((m, i) => (
                  <MemberCard key={m.name} member={m} delay={i * 0.05} />
                ))}
              </div>
            </div>
            
            {/* Travel */}
            <div className="bg-white/60 rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#25406b] mb-3 text-center">Travel & Accommodation</h3>
              <div className="flex justify-center gap-3 flex-wrap">
                {travel.map((m, i) => (
                  <MemberCard key={m.name} member={m} delay={i * 0.05} />
                ))}
              </div>
            </div>
            
            {/* Registration */}
            <div className="bg-white/60 rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#25406b] mb-3 text-center">Registration</h3>
              <div className="flex justify-center gap-3 flex-wrap">
                {registration.map((m, i) => (
                  <MemberCard key={m.name} member={m} delay={i * 0.05} />
                ))}
              </div>
            </div>
            
            {/* Food */}
            <div className="bg-white/60 rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#25406b] mb-3 text-center">Food & Beverages</h3>
              <div className="flex justify-center gap-3 flex-wrap">
                {food.map((m, i) => (
                  <MemberCard key={m.name} member={m} delay={i * 0.05} />
                ))}
              </div>
            </div>
            
            {/* Banquet */}
            <div className="bg-white/60 rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#25406b] mb-3 text-center">Banquet</h3>
              <div className="flex justify-center gap-3 flex-wrap">
                {banquet.map((m, i) => (
                  <MemberCard key={m.name} member={m} delay={i * 0.05} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
