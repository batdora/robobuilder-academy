import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const MODULE_LABELS: Record<string, string> = {
  '01-foundations': 'Foundations',
  '02-rl-foundations': 'RL',
  '03-deep-q-learning': 'DQN',
  '04-policy-optimization': 'Policy',
  '05-advanced-architectures': 'Advanced',
  '06-robot-learning': 'Robot',
};

const MODULE_MAX_XP: Record<string, number> = {
  '01-foundations': 400,
  '02-rl-foundations': 500,
  '03-deep-q-learning': 1000,
  '04-policy-optimization': 900,
  '05-advanced-architectures': 1000,
  '06-robot-learning': 600,
};

interface Props {
  moduleScores: Record<string, number>;
}

export default function ModuleRadar({ moduleScores }: Props) {
  const data = Object.entries(MODULE_LABELS).map(([id, label]) => ({
    module: label,
    score: Math.min(100, Math.round(((moduleScores[id] ?? 0) / (MODULE_MAX_XP[id] ?? 1000)) * 100)),
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#0f3460" />
          <PolarAngleAxis
            dataKey="module"
            tick={{ fill: '#a0a0b0', fontSize: 10, fontFamily: '"Press Start 2P"' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#a0a0b0', fontSize: 8 }}
            axisLine={false}
          />
          <Radar
            name="Mastery"
            dataKey="score"
            stroke="#00ff41"
            fill="#ffd700"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#16213e',
              border: '2px solid #0095ff',
              color: '#fff',
              fontFamily: '"Press Start 2P"',
              fontSize: '0.5rem',
            }}
            formatter={(value) => [`${value}%`, 'Mastery']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
