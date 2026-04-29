import type { SectorData } from '../types/market'

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')

interface Props {
  sectors: SectorData[]
}

export default function SectorPanel({ sectors }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xs font-black uppercase text-gray-500 px-4">Market Sector Heatmap</h2>
      <div className="grid grid-cols-4 gap-4">
        {sectors.map((sector) => (
          <div key={sector.sector} className={cn(
            'p-8 rounded-[2rem] border transition-all flex flex-col items-center justify-center text-center space-y-2',
            sector.change > 0 ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-rose-400/5 border-rose-400/20',
          )}>
            <p className="text-[10px] font-black uppercase text-gray-500">{sector.sector}</p>
            <p className={cn('text-3xl font-black italic', sector.change > 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {sector.change > 0 ? '+' : ''}{sector.change.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
      <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between">
        <p className="text-[10px] font-black uppercase text-gray-400">Sector Rotation Context</p>
        <p className="text-xs font-medium text-gray-500 leading-relaxed text-right max-w-xl">
          Sectoral rotation analysis helps identify where institutional capital is flowing. A sustained green IT or banking trend can indicate broad market strength, while leadership in defensive sectors may signal risk-off sentiment.
        </p>
      </div>
    </div>
  )
}
