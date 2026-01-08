import React from 'react';

/**
 * Example of using React.memo for performance optimization.
 * Use this pattern on components that:
 * - Receive the same props frequently
 * - Are expensive to render
 * - Don't need to re-render often
 */

interface ExpensiveCardProps {
    title: string;
    description: string;
    data: any[];
    onAction: () => void;
}

// ❌ Without React.memo - Re-renders every time parent renders
export function ExpensiveCard({ title, description, data, onAction }: ExpensiveCardProps) {
    console.log(`Rendering ${title}`);
    // ... expensive calculations or heavy JSX
    return <div>{/* component */}</div>;
}

// ✅ With React.memo - Only re-renders when props change
export const OptimizedCard = React.memo(function OptimizedCard({
    title,
    description,
    data,
    onAction
}: ExpensiveCardProps) {
    console.log(`Rendering ${title}`);
    // ... expensive calculations or heavy JSX
    return <div>{/* component */}</div>;
});

// ✅ With custom comparison function (advanced)
export const AdvancedOptimizedCard = React.memo(
    function AdvancedOptimizedCard(props: ExpensiveCardProps) {
        return <div>{/* component */}</div>;
    },
    (prevProps, nextProps) => {
        // Return true if props are equal (skip re-render)
        return (
            prevProps.title === nextProps.title &&
            prevProps.data.length === nextProps.data.length
        );
    }
);

/**
 * CANDIDATES FOR REACT.MEMO IN MEP PROJECTS:
 * 
 * 1. TaskCard - Rendered in lists, doesn't change often
 * 2. ProjectCard - Expensive with many children
 * 3. DocumentItem - In large grids/lists
 * 4. CalendarDay - Re-renders when scrubbing calendar
 * 5. StatWidget - Dashboard widgets with static data
 * 
 * WHEN NOT TO USE REACT.MEMO:
 * - Simple components (adds overhead)
 * - Props change frequently anyway
 * - Component has children prop
 */
