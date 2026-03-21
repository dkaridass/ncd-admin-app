
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-6xl font-bold text-primary dark:text-white">404</h1>
      <p className="text-2xl mt-4 text-gray-700">Page Introuvable</p>
      <p className="text-gray-500 mt-2">Désolé, la page que vous recherchez n'existe pas.</p>
      <Link to="/dashboard" className="mt-6 inline-block">
        <Button>
          Retour au Tableau de bord
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
