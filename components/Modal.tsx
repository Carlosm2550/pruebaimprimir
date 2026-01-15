
import React from 'react';
import { XIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  size?: 'default' | 'wide';
  headerContent?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'default', headerContent }) => {
  if (!isOpen) return null;

  const widthClass = size === 'wide' ? 'max-w-4xl' : 'max-w-lg';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className={`bg-gray-800 rounded-2xl shadow-2xl w-full ${widthClass} border border-gray-700 transform transition-all scale-95 hover:scale-100 duration-300`}>
        <div className="flex justify-between items-center p-5 border-b border-gray-700">
          <div className="text-xl font-bold text-amber-400 flex items-center flex-grow min-w-0">{title}</div>
          <div className="flex items-center space-x-4 ml-4">
            {headerContent}
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;