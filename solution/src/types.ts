// types.ts
// POI (Point of Interest) type definition
export type Poi = {
	key: string;                           // Unique identifier
	location: google.maps.LatLngLiteral;   // Geographical coordinates
	name: string;                          // Name of the location
	category: string;                      // Category classification
	genre: string;                         // Genre classification
	information?: string;                  // Additional information
	monday: string;                        // Monday business hours
	tuesday: string;                       // Tuesday business hours
	wednesday: string;                     // Wednesday business hours
	thursday: string;                      // Thursday business hours
	friday: string;                        // Friday business hours
	saturday: string;                      // Saturday business hours
	sunday: string;                        // Sunday business hours
	holiday: string;                       // Holiday business hours
	description: string;                   // Detailed description
	reservation: string;                   // Reservation information
	payment: string;                       // Payment methods
	phone: string;                         // Contact number
	address: string;                       // Physical address
	view?: string;                         // View-related information
	area: string;                          // Geographic area
  };
