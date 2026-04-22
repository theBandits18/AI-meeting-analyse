import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { MeetingRecord } from '../types'
import {
  formatCompactCurrency,
  formatCurrency,
  formatDateTime,
  getFrequencyLabel,
  getSeniorityLabel,
} from '../utils/format'
import { SectionCard } from './SectionCard'
import { StatTile } from './StatTile'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface HistoryDashboardProps {
  history: MeetingRecord[]
}

const getBarColor = (score: number) => {
  if (score >= 82) {
    return 'rgba(52, 211, 153, 0.8)'
  }

  if (score >= 64) {
    return 'rgba(103, 232, 249, 0.8)'
  }

  if (score >= 42) {
    return 'rgba(251, 191, 36, 0.8)'
  }

  return 'rgba(251, 113, 133, 0.8)'
}

export function HistoryDashboard({ history }: HistoryDashboardProps) {
  const chartHistory = [...history].reverse()
  const now = new Date()
  const currentMonthHistory = history.filter((meeting) => {
    const meetingDate = new Date(meeting.endedAt)

    return (
      meetingDate.getMonth() === now.getMonth() &&
      meetingDate.getFullYear() === now.getFullYear()
    )
  })

  const totalSpentThisMonth = currentMonthHistory.reduce(
    (total, meeting) => total + meeting.totalCost,
    0,
  )
  const averageRoi =
    history.length > 0
      ? history.reduce((total, meeting) => total + meeting.analysis.roiScore, 0) /
        history.length
      : 0
  const bestMeeting = [...history].sort(
    (left, right) => right.analysis.roiScore - left.analysis.roiScore,
  )[0]
  const worstMeeting = [...history].sort(
    (left, right) => left.analysis.roiScore - right.analysis.roiScore,
  )[0]

  const chartData: ChartData<'bar'> = {
    labels: chartHistory.map(
      (meeting) =>
        `${new Date(meeting.endedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })} - ${(meeting.title || 'Untitled').slice(0, 14)}`,
    ),
    datasets: [
      {
        label: 'Meeting cost',
        data: chartHistory.map((meeting) => Number(meeting.totalCost.toFixed(2))),
        backgroundColor: chartHistory.map((meeting) =>
          getBarColor(meeting.analysis.roiScore),
        ),
        borderRadius: 12,
      },
    ],
  }

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#cbd5e1',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            ` Cost: ${formatCurrency(Number(context.parsed.y ?? 0))}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8',
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.08)',
        },
      },
      y: {
        ticks: {
          color: '#94a3b8',
          callback: (value) => formatCompactCurrency(Number(value)),
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.08)',
        },
      },
    },
  }

  return (
    <SectionCard
      eyebrow="Section 4"
      title="History Dashboard"
      description="Every analyzed meeting is stored in localStorage so you can compare cost trends and see where your calendar is helping or hurting."
    >
      {history.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/12 bg-slate-900/40 p-8 text-center text-slate-400">
          No analyzed meetings yet. Finish one meeting and run the transcript analyzer to build your dashboard.
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Spent this month"
              value={formatCurrency(totalSpentThisMonth)}
              helper={`${currentMonthHistory.length} meetings this month`}
              accent="emerald"
            />
            <StatTile
              label="Average ROI"
              value={averageRoi.toFixed(0)}
              helper="Across all analyzed meetings"
              accent="cyan"
            />
            <StatTile
              label="Best meeting"
              value={bestMeeting ? bestMeeting.analysis.roiScore : 0}
              helper={bestMeeting ? bestMeeting.title || 'Untitled meeting' : 'No data'}
              accent="amber"
            />
            <StatTile
              label="Worst meeting"
              value={worstMeeting ? worstMeeting.analysis.roiScore : 0}
              helper={worstMeeting ? worstMeeting.title || 'Untitled meeting' : 'No data'}
              accent="rose"
            />
          </div>

          <div className="rounded-[26px] border border-white/8 bg-slate-900/80 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-display text-xl font-semibold text-white">
                Meeting cost over time
              </h3>
              <span className="text-sm text-slate-400">
                Color reflects ROI verdict quality
              </span>
            </div>
            <div className="h-80">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="overflow-hidden rounded-[26px] border border-white/8 bg-slate-900/80">
            <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-white/8 px-5 py-4 text-xs uppercase tracking-[0.24em] text-slate-400">
              <span>Meeting</span>
              <span>Cost</span>
              <span>ROI</span>
              <span>Details</span>
            </div>

            <div className="divide-y divide-white/6">
              {history.map((meeting) => (
                <div
                  key={meeting.id}
                  className="grid grid-cols-1 gap-4 px-5 py-4 text-sm text-slate-300 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]"
                >
                  <div>
                    <p className="font-medium text-white">
                      {meeting.title || 'Untitled meeting'}
                    </p>
                    <p className="mt-1 text-slate-400">{formatDateTime(meeting.endedAt)}</p>
                  </div>
                  <div className="text-white">{formatCurrency(meeting.totalCost)}</div>
                  <div>
                    <span
                      className="inline-flex rounded-full border border-white/10 px-3 py-1 text-white"
                      style={{ backgroundColor: getBarColor(meeting.analysis.roiScore) }}
                    >
                      {meeting.analysis.roiScore} - {meeting.analysis.verdict}
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-400">
                    <p>
                      {meeting.attendees} attendees, {getSeniorityLabel(meeting.seniority)}
                    </p>
                    <p>
                      {getFrequencyLabel(meeting.frequency)} /{' '}
                      {meeting.actualDurationMinutes.toFixed(0)} min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  )
}
