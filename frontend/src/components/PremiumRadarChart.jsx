import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const PremiumRadarChart = ({ data, isSimulated = false }) => {
  const centerX = 200;
  const centerY = 200;
  const maxRadius = 160;
  const levels = 5;
  const numAxes = data.length;

  // Calculate point coordinates
  const getPointCoordinates = (index, value, maxValue = 100) => {
    const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
    const radius = (value / maxValue) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  // Create polygon path
  const polygonPath = data.map((item, index) => {
    const { x, y } = getPointCoordinates(index, item.A);
    return (index === 0 ? 'M' : 'L') + ` ${x} ${y}`;
  }).join(' ') + ' Z';

  // Animation variants
  const polygonVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeOut"
      }
    }
  };

  const pointVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.5 + i * 0.1,
        duration: 0.5,
        type: "spring"
      }
    })
  };

  return (
    <div className="w-full h-full relative">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        {/* Concentric circles (layers) */}
        {Array.from({ length: levels }).map((_, i) => (
          <circle
            key={`grid-${i}`}
            cx={centerX}
            cy={centerY}
            r={(maxRadius / levels) * (i + 1)}
            fill="none"
            stroke="rgba(var(--color-border), 0.35)"
            strokeWidth="1"
          />
        ))}

        {/* Spider web lines (axes) */}
        {data.map((_, i) => {
          const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
          const endX = centerX + maxRadius * Math.cos(angle);
          const endY = centerY + maxRadius * Math.sin(angle);
          return (
            <line
              key={`axis-${i}`}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke="rgba(var(--color-border), 0.25)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon - animated */}
        <motion.path
          d={polygonPath}
          fill={isSimulated ? "rgba(52, 199, 123, 0.2)" : "rgba(201, 145, 52, 0.25)"}
          stroke={isSimulated ? "rgb(52, 199, 123)" : "rgb(201, 145, 52)"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={polygonVariants}
          initial="hidden"
          animate="visible"
        />

        {/* Data points */}
        {data.map((item, i) => {
          const { x, y } = getPointCoordinates(i, item.A);
          return (
            <motion.circle
              key={`point-${i}`}
              cx={x}
              cy={y}
              r="5"
              fill={isSimulated ? "rgb(52, 199, 123)" : "rgb(201, 145, 52)"}
              stroke="rgb(var(--color-surface))"
              strokeWidth="2"
              custom={i}
              variants={pointVariants}
              initial="hidden"
              animate="visible"
            />
          );
        })}

        {/* Axis labels */}
        {data.map((item, i) => {
          const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
          const labelRadius = maxRadius + 30;
          const x = centerX + labelRadius * Math.cos(angle);
          const y = centerY + labelRadius * Math.sin(angle);
          const textAnchor = Math.abs(angle + Math.PI / 2) < 0.01 ? 'middle' :
                            angle > -Math.PI / 2 && angle < Math.PI / 2 ? 'start' : 'end';
          const dy = Math.abs(angle) < 0.01 ? '0.35em' :
                    Math.abs(angle - Math.PI) < 0.01 ? '-0.35em' : '0.35em';

          return (
            <g key={`label-${i}`}>
              <text
                x={x}
                y={y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fill="rgb(var(--color-text-primary))"
                fontSize="13"
                fontWeight="600"
                fontFamily="'Space Grotesk', sans-serif"
              >
                {item.subject}
              </text>
              <text
                x={x}
                y={y + 16}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fill="rgb(var(--color-text-muted))"
                fontSize="11"
                fontFamily="'JetBrains Mono', monospace"
              >
                {item.A}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default PremiumRadarChart;
