// Simple select component without complex primitives
import React from 'react';

export const Select = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectItem = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectTrigger = ({ children, ...props }: any) => <button {...props}>{children}</button>;
export const SelectValue = ({ placeholder, ...props }: any) => <span {...props}>{placeholder || '---'}</span>;