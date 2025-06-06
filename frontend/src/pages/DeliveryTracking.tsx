import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { useCart, Order } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  CircleDashed, 
  CheckCircle2, 
  Package, 
  MapPin, 
  Phone,
  User,
  LucideIcon 
} from "lucide-react";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { toast } from "sonner";
import { socket } from '../lib/socket';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Location {
  coordinates: [number, number];
  lastUpdated: Date;
}

interface LocationUpdate {
  orderId: string;
  location: Location;
  status: string;
  distanceRemaining?: number;
  estimatedMinutesRemaining?: number;
  estimatedArrival?: Date;
}

const DeliveryTracking = () => {
  const { getUserOrders, verifyDeliveryOtp, addOrderReview } = useCart();
  const { user } = useAuth();  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Review states
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [tipAmount, setTipAmount] = useState("0");

  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  useEffect(() => {
    const fetchOrders = async () => {
      if (user?.email) {
        try {
          const response = await axios.get('http://localhost:5000/api/orders/myorders', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          console.log('Orders from API:', response.data);
          const orders = response.data;
          setOrders(orders);
          
          const activeOrders = orders.filter(order => 
            !['delivered', 'cancelled'].includes(order.status)
          );
          setActiveOrders(activeOrders);
          
          if (activeOrders.length > 0 && !selectedOrder) {
            setSelectedOrder(activeOrders[0]);
          }
          
          // If there's a selected order that's being delivered, connect socket
          if (selectedOrder?.status === 'delivering') {
            const userToken = localStorage.getItem('token');
            connectSocket(userToken, 'user', selectedOrder.id);
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
          toast.error('Failed to fetch orders');
        }
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(interval);
      disconnectSocket();
    };
  }, [user, selectedOrder]);
  
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "PPP p");
    } catch (e) {
      return dateString;
    }
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const handleVerifyOtp = () => {
    if (selectedOrder && enteredOtp) {
      const success = verifyDeliveryOtp(selectedOrder.id, enteredOtp);
      if (success) {
        setShowOtpDialog(false);
        setEnteredOtp("");
        
        // Show review dialog
        setReviewOrder(selectedOrder);
        setShowReviewDialog(true);
      }
    }
  };
  
  const handleSubmitReview = async () => {
    if (reviewOrder) {
      await addOrderReview(reviewOrder.id, rating, reviewText, parseInt(tipAmount));
      setShowReviewDialog(false);
      setRating(5);
      setReviewText("");
      setTipAmount("0");
      
      // Update orders list
      const userOrders = await getUserOrders(user.email);
      setOrders(userOrders);
      setSelectedOrder(userOrders.find(o => o.id === reviewOrder.id));
    }
  };
  
  const DeliveryStatus = ({ status }) => {
    // Define all the possible steps in the delivery process
    const steps = [
      { id: "placed", label: "Order Placed", icon: CircleDashed },
      { id: "accepted", label: "Preparing", icon: Package },
      { id: "delivering", label: "Out for Delivery", icon: Truck },
      { id: "delivered", label: "Delivered", icon: CheckCircle2 }
    ];
    
    // Find the current step index
    const currentStepIndex = steps.findIndex(step => step.id === status);
    if (currentStepIndex === -1) return null;
    
    return (
      <div className="mt-8">
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200"></div>
          <div 
            className="absolute top-5 left-5 h-0.5 bg-green-500 transition-all duration-500 ease-in-out"
            style={{ 
              width: `${currentStepIndex / (steps.length - 1) * 100}%` 
            }}  
          ></div>
          
          {/* Step circles */}
          <div className="flex justify-between relative z-10">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isActive = index === currentStepIndex;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-400'}
                    ${isActive ? 'ring-4 ring-green-100' : ''}
                  `}>
                    <StepIcon size={20} />
                  </div>
                  <span className={`
                    text-xs font-medium mt-2
                    ${isCompleted ? 'text-green-600' : 'text-gray-500'}
                  `}>
                    {step.label}
                  </span>                  {isActive && status === "delivering" && (
                    <span className="text-xs text-green-600 animate-pulse mt-1">
                      On the way
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Additional status details */}
        <div className="mt-10 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-3">Order Status Updates</h4>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <CheckCircle size={18} className="text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Order Received</p>
                <p className="text-xs text-gray-500">Your order has been received by our team.</p>
              </div>
            </li>
            
            {currentStepIndex >= 1 && (
              <li className="flex items-start space-x-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Food Preparation</p>
                  <p className="text-xs text-gray-500">Our chefs are preparing your delicious meal.</p>
                </div>
              </li>
            )}
            
            {currentStepIndex >= 2 && (
              <li className="flex items-start space-x-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Out for Delivery</p>
                  <p className="text-xs text-gray-500">Your food is on the way to your location.</p>
                </div>
              </li>
            )}
            
            {currentStepIndex >= 3 && (
              <li className="flex items-start space-x-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Delivered</p>
                  <p className="text-xs text-gray-500">Your order has been delivered successfully.</p>
                </div>
              </li>
            )}
              {status === "delivering" && (
              <li className="flex items-start space-x-3 mt-4 border-t pt-4">
                <div className="bg-blue-100 p-3 rounded-lg w-full">
                  <p className="text-sm font-medium mb-2">Your OTP: <span className="font-bold">{selectedOrder.otp}</span></p>
                  <p className="text-xs text-gray-700">Share this OTP with the delivery person to verify your order.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowOtpDialog(true)}
                  >
                    Confirm Delivery
                  </Button>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  };
    const LiveMap = ({ orderId, status, deliveryAddress }) => {
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
    const [estimatedInfo, setEstimatedInfo] = useState<{
      distance?: number;
      duration?: number;
      arrival?: Date;
    }>({});
    const mapRef = useRef(null);

    useEffect(() => {
      if (!orderId || status !== 'delivering') return;

      // Set initial location from delivery address
      if (deliveryAddress?.location?.coordinates) {
        const [lng, lat] = deliveryAddress.location.coordinates;
        setCurrentLocation({
          coordinates: [lat, lng],
          lastUpdated: new Date()
        });
      }

      // Listen for location updates
      socket.on('delivery_location_updated', (data: LocationUpdate) => {
        if (data.orderId === orderId) {
          setCurrentLocation(data.location);
          setEstimatedInfo({
            distance: data.distanceRemaining,
            duration: data.estimatedMinutesRemaining,
            arrival: data.estimatedArrival ? new Date(data.estimatedArrival) : undefined
          });
        }
      });

      return () => {
        socket.off('delivery_location_updated');
      };
    }, [orderId, status]);

    // Center map on current location
    const MapUpdater = () => {
      const map = useMap();
      
      useEffect(() => {
        if (currentLocation) {
          const [lng, lat] = currentLocation.coordinates;
          map.setView([lat, lng], 15);
        }
      }, [currentLocation]);

      return null;
    };    if (!currentLocation || status !== "delivering") {
      return (
        <div className="relative rounded-lg overflow-hidden h-64 bg-gray-50">
          <div className="absolute inset-0 flex flex-col items-center justify-center">            {status === "delivered" ? (
              <>
                <CheckCircle size={32} className="text-green-500 mb-2" />
                <p className="text-gray-600 text-sm">Delivery Completed</p>
              </>
            ) : (
              <>
                <Clock size={32} className="text-gray-400 mb-2" />
                <p className="text-gray-600 text-sm">Tracking will be available once your order is out for delivery</p>
              </>
            )}
          </div>
        </div>
      );
    }

    return (      <div className="space-y-4">
        <div className="h-[400px] relative rounded-lg overflow-hidden">
          <MapContainer
            center={currentLocation ? 
              [currentLocation.coordinates[1], currentLocation.coordinates[0]] : 
              [20.7504, 73.7333]} // Default center (India)
            zoom={15}
            className="h-full w-full"
            ref={mapRef}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {currentLocation && (
              <Marker 
                position={[currentLocation.coordinates[1], currentLocation.coordinates[0]]} 
                icon={deliveryIcon}
              >
                <Popup>
                  Delivery Partner's Location
                  <br />
                  Last updated: {new Date(currentLocation.lastUpdated).toLocaleTimeString()}
                </Popup>
              </Marker>
            )}            {deliveryAddress?.location?.coordinates && (
              <Marker 
                position={[
                  deliveryAddress.location.coordinates[1],
                  deliveryAddress.location.coordinates[0]
                ]} 
                icon={destinationIcon}
              >
                <Popup>
                  <div className="text-sm font-medium">Delivery Address</div>
                  <div className="text-xs mt-1">{deliveryAddress.street}</div>
                  <div className="text-xs">{deliveryAddress.city}, {deliveryAddress.state}</div>
                </Popup>
              </Marker>
            )}
            <MapUpdater />
          </MapContainer>
        </div>
        
        {estimatedInfo.distance && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Distance Remaining</span>
              <span className="text-sm">{estimatedInfo.distance.toFixed(1)} km</span>
            </div>
            {estimatedInfo.duration && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estimated Time</span>
                <span className="text-sm">{estimatedInfo.duration} mins</span>
              </div>
            )}
            {estimatedInfo.arrival && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expected Arrival</span>
                <span className="text-sm">{estimatedInfo.arrival.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container-custom">
          <SectionHeading 
            title="Track Your Order" 
            subtitle="Follow your order in real-time" 
          />
            {loading ? (
            <div className="bg-white p-8 rounded-lg shadow text-center mt-8">
              <div className="animate-spin w-6 h-6 border-2 border-burgundy border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="bg-white p-8 rounded-lg shadow text-center mt-8">
              <h3 className="text-xl font-bold mb-4 text-red-600">Error Loading Orders</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center mt-8">
              <h3 className="text-xl font-bold mb-4">No Active Orders</h3>
              <p className="text-gray-600 mb-6">You don't have any active orders to track at the moment.</p>
              <Button onClick={() => window.location.href = '/menu'}>
                Browse Menu
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              {/* Order List */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Your Orders</h3>
                  
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <button
                        key={order.id}
                        className={`w-full text-left p-4 rounded-lg transition-all ${
                          selectedOrder?.id === order.id 
                            ? 'bg-burgundy/10 border-burgundy border' 
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                        }`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{order.id}</p>
                            <p className="text-xs text-gray-500">{formatDate(order.date)}</p>
                          </div>                          <Badge className={
                            order.status === "delivered" 
                              ? "bg-green-100 text-green-800" 
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : order.status === "accepted"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "delivering"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-yellow-100 text-yellow-800"
                          }>
                            {order.status === "delivering" ? "Out for Delivery" : order.status}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-600">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'} • {formatPrice(order.total)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Order Details and Tracking */}
              <div className="lg:col-span-2">
                {selectedOrder && (
                  <div className="space-y-6">
                    {/* Order Details Card */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{selectedOrder.id}</h3>
                          <p className="text-sm text-gray-500">{formatDate(selectedOrder.date)}</p>
                        </div>                        <Badge className={
                          selectedOrder.status === "delivered" 
                            ? "bg-green-100 text-green-800" 
                            : selectedOrder.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : selectedOrder.status === "accepted"
                            ? "bg-blue-100 text-blue-800"
                            : selectedOrder.status === "delivering"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-yellow-100 text-yellow-800"
                        }>
                          {selectedOrder.status === "delivering" ? "Out for Delivery" : selectedOrder.status}
                        </Badge>
                      </div>
                      
                      <div className="border-t border-b py-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Delivery Address</p>
                          <div className="flex items-start mt-1">
                            <MapPin size={16} className="text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{`${selectedOrder.deliveryAddress.street}, ${selectedOrder.deliveryAddress.city}, ${selectedOrder.deliveryAddress.state} ${selectedOrder.deliveryAddress.zipCode}`}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Contact Number</p>
                          <div className="flex items-center mt-1">
                            <Phone size={16} className="text-gray-400 mr-1" />
                            <p className="text-sm">{selectedOrder.deliveryPhone}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-4">
                        <p className="text-xs text-gray-500 mb-2">Order Summary</p>
                        <ul className="space-y-2">
                          {selectedOrder.items.map((item) => (
                            <li key={item.id} className="flex justify-between text-sm">
                              <span>{item.quantity} × {item.name}</span>
                              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 pt-4 border-t flex justify-between font-medium">
                          <span>Total</span>
                          <span className="text-burgundy">{formatPrice(selectedOrder.total)}</span>
                        </div>
                      </div>
                      
                      {selectedOrder.status === "delivered" && selectedOrder.review && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-gray-500 mb-2">Your Review</p>
                          <div className="flex items-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <CheckCircle
                                key={i}
                                size={16}
                                className={i < selectedOrder.review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                              />
                            ))}
                          </div>
                          <p className="text-sm">{selectedOrder.review.comment}</p>
                          {selectedOrder.review.tip > 0 && (
                            <p className="text-sm mt-2 text-gray-600">
                              Tip: {formatPrice(selectedOrder.review.tip)}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {selectedOrder.status === "delivered" && !selectedOrder.review && (
                        <div className="mt-4 pt-4 border-t">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setReviewOrder(selectedOrder);
                              setShowReviewDialog(true);
                            }}
                          >
                            Rate Your Experience
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Live Tracking Map */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold mb-4">Live Tracking</h3>
                      <LiveMap orderId={selectedOrder.id} status={selectedOrder.status} deliveryAddress={selectedOrder.deliveryAddress} />
                    </div>
                    
                    {/* Delivery Status */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold mb-4">Delivery Status</h3>
                      <DeliveryStatus status={selectedOrder.status} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* OTP Verification Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Delivery</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-gray-600">Please provide the OTP to the delivery person to confirm receipt of your order.</p>
            
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">Your OTP</label>
              <div className="relative">
                <Input 
                  id="otp"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="Enter the 4-digit OTP"
                  maxLength={4}
                  className="text-center text-lg tracking-widest"
                />
              </div>
            </div>
            
            <div className="pt-4 space-y-2">
              <Button 
                onClick={handleVerifyOtp} 
                className="w-full"
              >
                Verify & Complete Delivery
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowOtpDialog(false)} 
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">How was your food and delivery experience?</p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <CheckCircle
                      size={24}
                      className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="review" className="text-sm font-medium">Your Review</label>
              <Textarea
                id="review"
                placeholder="Share your experience with the food and delivery..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2 pt-2 border-t">
              <label htmlFor="tip" className="text-sm font-medium">Add a Tip for Delivery (Optional)</label>
              <div className="grid grid-cols-4 gap-2">
                {["0", "20", "50", "100"].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTipAmount(amount)}
                    className={`py-2 border rounded-md focus:outline-none transition-colors ${
                      tipAmount === amount 
                        ? "border-burgundy bg-burgundy/10 text-burgundy" 
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {amount === "0" ? "No Tip" : `₹${amount}`}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">100% of your tip goes to the delivery person</p>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Skip
              </Button>
              <Button onClick={handleSubmitReview}>
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DeliveryTracking;
