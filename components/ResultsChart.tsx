// components/ResultsChart.tsx
"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Candidate } from "../lib/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const COLORS = [
  "#36d1dc", "#ff6b6b", "#ffd700", "#5b86e5", "#ff7f50",
  "#7b68ee", "#00fa9a", "#ff69b4", "#ffa500", "#1e90ff",
  "#ff00ff", "#00ffff", "#98fb98", "#ff6347", "#4682b4"
];

type Props = {
  candidates: Candidate[];
};

export default function ResultsChart({ candidates }: Props) {
  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);

  const data = {
    labels: sortedCandidates.map((c) => c.name),
    datasets: [
      {
        label: "Votes",
        data: sortedCandidates.map((c) => c.votes || 0),
        backgroundColor: sortedCandidates.map((_, i) => COLORS[i % COLORS.length]),
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.raw} vote${context.raw !== 1 ? "s" : ""}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#fff", font: { size: 14 } },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      y: {
        ticks: { color: "#fff", beginAtZero: true, stepSize: 1 },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
    },
  };

  return (
    <div style={{ height: "400px", width: "100%" }}>
      <Bar data={data} options={options} />
    </div>
  );
}