import React, { ReactNode } from 'react';

interface InfoItemProps {
  title?: string;
  content: ReactNode;
}

export const InfoItem: React.FC<InfoItemProps> = ({ title, content }) => {
  return (
    <div className="infoSection">
      {title && <h3>{title}</h3>}
      {content}
    </div>
  );
};
