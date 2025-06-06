
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useCart } from "@/context/CartContext";
import { useReservation } from "@/context/ReservationContext";
import { useAuth } from "@/context/AuthContext";
import { Edit, Star, Send, CreditCard, Bike, MapPin, Phone, Mail, User } from "lucide-react";
import { toast } from "sonner";

const timeSlots = [
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM"
];

const Profile = () => {
  const { getUserOrders, verifyDeliveryOtp, updateOrderStatus, orders } = useCart();
  const { getUserReservations, updateReservationDetails } = useReservation();
  const { user, updateUserProfile, isDeliveryBoy } = useAuth();
  const [userOrders, setUserOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [editingReservation, setEditingReservation] = useState(null);
  const [updatedTime, setUpdatedTime] = useState("");
  const [updatedPartySize, setUpdatedPartySize] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Delivery boy profile states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  
  // Order review states
  const [reviewOrder, setReviewOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [tipAmount, setTipAmount] = useState("0");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  
  // OTP verification states
  const [verifyingOrder, setVerifyingOrder] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [showOtpDialog, setShowOtpDialog] = useState(false);

  useEffect(() => {
    if (user?.email) {
      if (!isDeliveryBoy) {
        const userOrdersData = getUserOrders(user.email);
        setUserOrders(userOrdersData);
        
        const userReservationsData = getUserReservations(user.email);
        setReservations(userReservationsData);
      } else {
        // Load saved delivery boy profile if exists
        const savedProfile = localStorage.getItem(`deliveryProfile_${user.email}`);
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          setName(profile.name || user.name);
          setPhone(profile.phone || "");
          setAddress(profile.address || "");
          setBio(profile.bio || "");
          setProfileSaved(true);
        } else {
          setName(user.name);
        }
      }
    }
  }, [user, getUserOrders, getUserReservations, isDeliveryBoy]);

  // Format price in Indian Rupees
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return dateString;
    }
  };

  const handleEditReservation = (reservation) => {
    setEditingReservation(reservation);
    setUpdatedTime(reservation.time);
    setUpdatedPartySize(reservation.partySize);
    setIsDialogOpen(true);
  };

  const handleUpdateReservation = () => {
    if (editingReservation) {      updateReservationDetails(editingReservation._id || editingReservation.id, {
        time: updatedTime,
        partySize: updatedPartySize
      });
      setIsDialogOpen(false);
      toast.success("Reservation updated successfully");
    }
  };
  
  const handleSaveProfile = () => {
    // Save delivery boy profile
    const profile = {
      name,
      phone,
      address,
      bio,
      email: user.email
    };
    
    localStorage.setItem(`deliveryProfile_${user.email}`, JSON.stringify(profile));
    updateUserProfile(name);
    setProfileSaved(true);
    toast.success("Profile saved successfully");
  };
  
  const handleVerifyOtp = () => {
    if (verifyingOrder && enteredOtp) {
      const success = verifyDeliveryOtp(verifyingOrder.id, enteredOtp);
      if (success) {
        setShowOtpDialog(false);
        setEnteredOtp("");
        // Show review dialog after successful delivery
        setReviewOrder(verifyingOrder);
        setShowReviewDialog(true);
      }
    }
  };
  
  const handleSubmitReview = () => {
    // Update order with review
    if (reviewOrder) {
      const orderIndex = orders.findIndex(order => order.id === reviewOrder.id);
      if (orderIndex !== -1) {
        const updatedOrders = [...orders];
        updatedOrders[orderIndex] = {
          ...updatedOrders[orderIndex],
          review: {
            rating,
            comment: reviewText,
            tip: parseInt(tipAmount)
          }
        };
        
        // In a real app, we would save this to the backend
        localStorage.setItem("orders", JSON.stringify(updatedOrders));
        toast.success("Thank you for your review!");
        
        // Update local state
        setUserOrders(getUserOrders(user.email));
      }
    }
    
    setShowReviewDialog(false);
    setRating(5);
    setReviewText("");
    setTipAmount("0");
  };

  if (isDeliveryBoy) {
    return (
      <Layout>
        <div className="min-h-screen pt-24 pb-16">
          <div className="container-custom">
            <SectionHeading
              title="Delivery Profile"
              subtitle="Manage your delivery information"
            />
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Profile Information */}
              <div className="md:col-span-2">
                <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                  <h3 className="text-xl font-bold mb-4">Personal Information</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">Name</label>
                        <div className="flex items-center space-x-2">
                          <User size={18} className="text-gray-500" />
                          <Input 
                            id="name" 
                            placeholder="Your name" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email (Cannot be changed)</label>
                        <div className="flex items-center space-x-2">
                          <Mail size={18} className="text-gray-500" />
                          <Input 
                            id="email" 
                            value={user?.email || ""}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                        <div className="flex items-center space-x-2">
                          <Phone size={18} className="text-gray-500" />
                          <Input 
                            id="phone" 
                            placeholder="Your contact number" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="address" className="text-sm font-medium">Address</label>
                        <div className="flex items-center space-x-2">
                          <MapPin size={18} className="text-gray-500" />
                          <Input 
                            id="address" 
                            placeholder="Your address" 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="bio" className="text-sm font-medium">About Yourself</label>
                      <Textarea 
                        id="bio" 
                        placeholder="Tell customers a bit about yourself..." 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                      />
                    </div>
                    
                    <Button onClick={handleSaveProfile} className="w-full">Save Profile</Button>
                  </div>
                </div>
              </div>
              
              {/* Stats and Quick Info */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-bold mb-4">Delivery Stats</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed Deliveries</span>
                      <span className="font-bold">{profileSaved ? "12" : "0"}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Rating</span>
                      <div className="flex items-center">
                        <span className="font-bold mr-1">{profileSaved ? "4.8" : "0"}</span>
                        <Star size={16} className="fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">On-time Deliveries</span>
                      <span className="font-bold">{profileSaved ? "98%" : "0%"}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium text-sm mb-3">Your Vehicle</h4>
                    <div className="flex items-center space-x-2">
                      <Bike size={20} className="text-burgundy" />
                      <span>{profileSaved ? "Delivery Motorcycle" : "Not specified"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-burgundy/10 p-6 rounded-lg">
                  <h3 className="text-lg font-bold mb-2">Quick Tips</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <div className="min-w-4 h-4 bg-burgundy rounded-full mt-1"></div>
                      <span>Always verify the OTP before handing over the order</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="min-w-4 h-4 bg-burgundy rounded-full mt-1"></div>
                      <span>Be polite and professional with customers</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="min-w-4 h-4 bg-burgundy rounded-full mt-1"></div>
                      <span>Keep your phone charged and app open during deliveries</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container-custom">
          <SectionHeading
            title="My Profile"
            subtitle="Track your orders and reservations"
          />
          
          <div className="mt-8">
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="flex justify-center mb-8">
                <TabsTrigger value="orders">My Orders</TabsTrigger>
                <TabsTrigger value="reservations">My Reservations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="orders">
                <div className="bg-white p-6 rounded-lg shadow-md overflow-auto">
                  <h3 className="text-xl font-bold mb-4">Order History</h3>
                  
                  {userOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">You haven't placed any orders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {userOrders.map((order) => (
                        <div key={order.id} className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-50 p-4 flex justify-between items-center">
                            <div>
                              <span className="font-medium">{order.id}</span>
                              <div className="text-sm text-gray-500">
                                {formatDate(order.date)}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm text-gray-500">Total</div>
                                <div className="font-bold text-burgundy">{formatPrice(order.total)}</div>
                              </div>
                              <Badge className={
                                order.status === "completed" 
                                  ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                  : order.status === "cancelled"
                                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                                  : order.status === "processing"
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                  : order.status === "out_for_delivery"
                                  ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              }>
                                {order.status === "out_for_delivery" ? "Out for Delivery" : order.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Item</TableHead>
                                  <TableHead className="text-right">Qty</TableHead>
                                  <TableHead className="text-right">Price</TableHead>
                                  <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.items.map((item) => (
                                  <TableRow key={`${order.id}-${item.id}`}>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded overflow-hidden">
                                          <img 
                                            src={item.image} 
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        {item.name}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                                    <TableCell className="text-right">{formatPrice(item.price * item.quantity)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>

                            {order.status === "out_for_delivery" && (
                              <div className="mt-4 border-t pt-4">
                                <p className="font-medium text-sm mb-2">Delivery Information</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium">Delivery OTP:</p>
                                    <p className="bg-gray-100 px-2 py-1 rounded inline-block text-sm">{order.otp}</p>
                                    <p className="text-xs text-gray-500 mt-1">Share with delivery person only</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Payment Method:</p>
                                    <p className="text-sm">
                                      {order.paymentMethod === "cash" 
                                        ? "Cash on Delivery" 
                                        : "Paid Online"}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="mt-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setVerifyingOrder(order);
                                      setShowOtpDialog(true);
                                    }}
                                  >
                                    Confirm Delivery
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {order.status === "completed" && order.review && (
                              <div className="mt-4 border-t pt-4">
                                <p className="font-medium text-sm mb-2">Your Review</p>
                                <div className="flex items-center mb-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      size={18}
                                      className={i < order.review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                    />
                                  ))}
                                </div>
                                <p className="text-sm text-gray-700">{order.review.comment}</p>
                                {order.review.tip > 0 && (
                                  <p className="text-sm mt-2">
                                    <span className="text-gray-600">Tip given:</span> {formatPrice(order.review.tip)}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {order.status === "completed" && !order.review && (
                              <div className="mt-4 border-t pt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReviewOrder(order);
                                    setShowReviewDialog(true);
                                  }}
                                >
                                  Leave a Review
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="reservations">
                <div className="bg-white p-6 rounded-lg shadow-md overflow-auto">
                  <h3 className="text-xl font-bold mb-4">My Reservations</h3>
                  
                  {reservations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">You haven't made any reservations yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Party Size</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Table No</TableHead>
                          <TableHead>Special Requests</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservations.map((reservation) => (                          <TableRow key={reservation._id || reservation.id}>
                            <TableCell>{formatDate(reservation.date)}</TableCell>
                            <TableCell>{reservation.time}</TableCell>
                            <TableCell>{reservation.partySize} {parseInt(reservation.partySize) === 1 ? 'person' : 'people'}</TableCell>
                            <TableCell>
                              <Badge className={
                                reservation.status === "approved" 
                                  ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                  : reservation.status === "rejected"
                                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                                  : reservation.status === "delivered"
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              }>
                                {reservation.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{reservation.tableNumber || "-"}</TableCell>
                            <TableCell>{reservation.specialRequests || "-"}</TableCell>
                            <TableCell>
                              {(reservation.status === "pending" || reservation.status === "approved") && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditReservation(reservation)}
                                >
                                  <Edit size={16} />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Edit Reservation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Reservation</DialogTitle>
          </DialogHeader>
          {editingReservation && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Name:</p>
                  <p className="text-gray-700">{editingReservation.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Date:</p>
                  <p className="text-gray-700">{formatDate(editingReservation.date)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Preferred Time:</p>
                <Select value={updatedTime} onValueChange={setUpdatedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Number of Guests:</p>
                <Select value={updatedPartySize} onValueChange={setUpdatedPartySize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select party size" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size} {size === 1 ? 'person' : 'people'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateReservation}>
                  Update Reservation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* OTP Verification Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Delivery OTP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">Please provide the OTP to the delivery person to confirm receipt of your order.</p>
            
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">One-Time Password (OTP)</label>
              <Input 
                id="otp"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="Enter the 4-digit OTP"
                maxLength={4}
              />
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowOtpDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleVerifyOtp}>
                Verify & Complete Delivery
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Review Order Dialog */}
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
                    <Star
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
                placeholder="Share your experience..."
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
              <Button onClick={handleSubmitReview} className="flex items-center gap-2">
                <Send size={16} />
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Profile;
