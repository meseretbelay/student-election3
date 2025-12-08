"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function ResultsChart({ data }: any) {
  const barColors = [
    "rgba(99, 102, 241, 0.9)",   // Indigo
    "rgba(16, 185, 129, 0.9)",   // Emerald
    "rgba(239, 68, 68, 0.9)",    // Red
    "rgba(234, 179, 8, 0.9)",    // Yellow
    "rgba(59, 130, 246, 0.9)",   // Blue
  ];

  return (
    <div
      style={{
        width: "90%",
        maxWidth: "900px",
        margin: "40px auto",
        display: "flex",
        justifyContent: "center",
      }}
    >
      {/* ▶️ Increased height here */}
      <div style={{ width: "100%", height: "400px" }}>
        <Bar
          data={{
            labels: data.map((c: any) => c.name),
            datasets: [
              {
                label: "Votes",
                data: data.map((c: any) => c.votes),
                backgroundColor: data.map(
                  (_: any, i: number) => barColors[i % barColors.length]
                ),
                borderRadius: 10,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false, // important for height change
            animation: {
              duration: 1500,
              easing: "easeOutQuart",
            },
            scales: {
              y: { beginAtZero: true },
            },
          }}
        />
      </div>
    </div>
  );
}
