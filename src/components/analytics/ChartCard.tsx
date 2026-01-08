'use client';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ChartData,
    ChartOptions
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { useRef } from 'react';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface ChartCardProps {
    title: string;
    subtitle?: string;
    type: 'line' | 'bar' | 'doughnut' | 'pie';
    data: ChartData<any>;
    options?: ChartOptions<any>;
    height?: number;
    className?: string;
}

export default function ChartCard({
    title,
    subtitle,
    type,
    data,
    options,
    height = 300,
    className = ''
}: ChartCardProps) {
    const chartRef = useRef<any>(null);

    // Default options
    const defaultOptions: ChartOptions<any> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 20,
                    font: {
                        family: 'Inter, sans-serif',
                        size: 12
                    },
                    color: '#737373' // neutral-500
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#171717', // neutral-900
                bodyColor: '#525252', // neutral-600
                borderColor: '#e5e5e5', // neutral-200
                borderWidth: 1,
                padding: 12,
                boxPadding: 4,
                usePointStyle: true,
                titleFont: {
                    family: 'Inter, sans-serif',
                    size: 13,
                    weight: 'bold'
                },
                bodyFont: {
                    family: 'Inter, sans-serif',
                    size: 12
                },
                callbacks: {
                    labelColor: function (context: any) {
                        return {
                            borderColor: context.dataset.borderColor,
                            backgroundColor: context.dataset.backgroundColor,
                            borderWidth: 1,
                            borderRadius: 2,
                        };
                    }
                }
            }
        },
        scales: type === 'doughnut' || type === 'pie' ? undefined : {
            x: {
                grid: {
                    display: false,
                    drawBorder: false
                },
                ticks: {
                    font: {
                        family: 'Inter, sans-serif',
                        size: 11
                    },
                    color: '#a3a3a3' // neutral-400
                }
            },
            y: {
                grid: {
                    color: '#f5f5f5',
                    drawBorder: false,
                },
                ticks: {
                    font: {
                        family: 'Inter, sans-serif',
                        size: 11
                    },
                    color: '#a3a3a3', // neutral-400
                    padding: 10
                },
                border: {
                    display: false
                }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        plugins: {
            ...defaultOptions.plugins,
            ...options?.plugins,
        },
        scales: {
            ...defaultOptions.scales,
            ...options?.scales,
        }
    };

    const renderChart = () => {
        switch (type) {
            case 'line':
                return <Line ref={chartRef} data={data} options={mergedOptions} />;
            case 'bar':
                return <Bar ref={chartRef} data={data} options={mergedOptions} />;
            case 'doughnut':
                return <Doughnut ref={chartRef} data={data} options={mergedOptions} />;
            case 'pie':
                return <Pie ref={chartRef} data={data} options={mergedOptions} />;
            default:
                return null;
        }
    };

    const handleDownload = () => {
        if (chartRef.current) {
            const url = chartRef.current.toBase64Image();
            const link = document.createElement('a');
            link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-chart.png`;
            link.href = url;
            link.click();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{title}</h3>
                    {subtitle && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{subtitle}</p>
                    )}
                </div>
                <button
                    onClick={handleDownload}
                    className="p-2 text-neutral-400 hover:text-olive-600 hover:bg-olive-50 dark:hover:bg-olive-900/20 rounded-lg transition-colors"
                    title="Descargar gráfico"
                >
                    <Download className="w-4 h-4" />
                </button>
            </div>

            <div style={{ height }} className="relative w-full">
                {renderChart()}
            </div>
        </motion.div>
    );
}
