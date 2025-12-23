
import React from 'react';
import { PropertyDetails } from '../types';

interface PropertyCardProps {
  property: PropertyDetails;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{property.address}</h1>
          <div className="flex flex-wrap gap-4 mt-2">
            {property.price && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-50 text-green-700 border border-green-100">
                {property.price}
              </span>
            )}
            {property.beds && (
              <span className="text-gray-600 flex items-center gap-1">
                <span className="font-semibold">{property.beds}</span> Beds
              </span>
            )}
            {property.baths && (
              <span className="text-gray-600 flex items-center gap-1">
                <span className="font-semibold">{property.baths}</span> Baths
              </span>
            )}
            {property.sqft && (
              <span className="text-gray-600 flex items-center gap-1">
                <span className="font-semibold">{property.sqft}</span> Sq Ft
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-sm text-gray-400 italic">Extracted {property.images.length} images</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
