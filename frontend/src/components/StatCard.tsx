import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import type { SxProps } from '@mui/material';
import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  loading?: boolean;
  sx?: SxProps;
}

export default function StatCard({ title, value, subtitle, icon, color = '#1976d2', loading, sx }: StatCardProps) {
  return (
    <Card sx={{ borderRadius: 3, ...sx }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={80} height={48} />
            ) : (
              <Typography variant="h4" fontWeight={700}>{value}</Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            )}
          </Box>
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 2,
            bgcolor: `${color}20`, color,
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
