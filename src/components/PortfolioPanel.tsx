import { Wallet, Plus } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

import type { PortfolioHoldingInput, PortfolioSummary } from '../types/portfolio'

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')

interface Props {
  portfolio: PortfolioSummary
  newHolding: PortfolioHoldingInput
  setNewHolding: Dispatch<SetStateAction<PortfolioHoldingInput>>
  addHolding: () => void
}

export default function PortfolioPanel({ portfolio, newHolding, setNewHolding, addHolding }: Props) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between p-12 bg-cyan-400 rounded-[3rem] text-black shadow-2xl shadow-cyan-400/10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Portfolio Value</p>
          <h2 className="text-6xl font-black tracking-tighter italic uppercase">₹{portfolio.total_value.toLocaleString()}</h2>
        </div>
        <div className="w-20 h-20 rounded-3xl bg-black/10 flex items-center justify-center"><Wallet size={40} /></div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <input placeholder="Ticker" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase outline-none focus:border-cyan-400" value={newHolding.ticker} onChange={(event) => setNewHolding({ ...newHolding, ticker: event.target.value })} />
        <input placeholder="Qty" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase outline-none focus:border-cyan-400" value={newHolding.qty} onChange={(event) => setNewHolding({ ...newHolding, qty: event.target.value })} />
        <input placeholder="Price" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase outline-none focus:border-cyan-400" value={newHolding.price} onChange={(event) => setNewHolding({ ...newHolding, price: event.target.value })} />
        <button onClick={addHolding} className="bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-cyan-400 hover:text-black transition-all flex items-center justify-center space-x-2"><Plus size={16} /><span>Add Holding</span></button>
      </div>
      <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black uppercase text-gray-500 border-b border-white/5">
              <th className="pb-4">Asset</th><th className="pb-4 text-right">Qty</th><th className="pb-4 text-right">Avg Price</th><th className="pb-4 text-right">Market Price</th><th className="pb-4 text-right">PnL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {portfolio.holdings.map((holding) => (
              <tr key={holding.symbol} className="text-sm font-bold">
                <td className="py-6">{holding.symbol}</td>
                <td className="py-6 text-right">{holding.qty}</td>
                <td className="py-6 text-right">₹{holding.avg_price.toLocaleString()}</td>
                <td className="py-6 text-right font-black">₹{holding.curr_price.toLocaleString()}</td>
                <td className={cn('py-6 text-right font-black', holding.pnl > 0 ? 'text-emerald-400' : 'text-rose-400')}>₹{holding.pnl.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
