import React from 'react';
import { Key, ShieldCheck } from 'lucide-react';

export default function SettingsPanel({ saveToVault }: any) {
  return (
    <div className="space-y-8">
      <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-8">
        <div className="flex items-center space-x-4">
          <Key className="text-cyan-400" size={24} />
          <h2 className="text-xl font-black uppercase italic">Credential Vault</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500 ml-2">NVIDIA NIM API</label>
            <input placeholder="Enter Key..." type="password" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none focus:border-cyan-400" onChange={e => saveToVault('nvidia_api_key', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Groq Cloud API</label>
            <input placeholder="Enter Key..." type="password" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none focus:border-cyan-400" onChange={e => saveToVault('groq_api_key', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Zerodha API Key</label>
            <input placeholder="Enter Key..." type="password" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black uppercase outline-none focus:border-cyan-400" onChange={e => saveToVault('zerodha_api_key', e.target.value)} />
          </div>
        </div>

        <div className="p-6 bg-cyan-400/5 border border-cyan-400/20 rounded-2xl flex items-start space-x-4">
          <ShieldCheck className="text-cyan-400 shrink-0" size={20} />
          <div className="space-y-1">
            <p className="text-xs font-bold text-cyan-400 uppercase">Security Note</p>
            <p className="text-[10px] text-gray-400 leading-relaxed">All credentials are encrypted locally using AES-256 (Fernet) and stored in a secure SQLite vault. We recommend using Environment Variables for production deployments. Never share your secret.key.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
