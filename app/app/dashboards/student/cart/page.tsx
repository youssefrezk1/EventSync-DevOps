"use client";

import React, { useEffect, useState } from "react";
import BasicLayout from "@/components/layouts/basicLayout2";
import { Box, Typography, Button, IconButton, TextField, Select, MenuItem } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from "@/api";

function decodeTokenId(): string | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = JSON.parse(decodeURIComponent(atob(payload.replace(/-/g, '+').replace(/_/g, '/')).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')));
    return json.id || json._id || json.sub || null;
  } catch (err) {
    console.warn('Token decode failed', err);
    return null;
  }
}

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pickup, setPickup] = useState('UC');

  useEffect(() => { fetchCart(); }, []);

  async function fetchCart() {
    try {
      setLoading(true);
      const studentId = decodeTokenId();
      if (!studentId) return;
      const res = await api.get(`/cart/${studentId}`);
      setCart(res.data?.cart || null);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  async function updateQuantity(foodItemId: string, qty: number) {
    try {
      const studentId = decodeTokenId();
      await api.post('/cart/update', { studentId, foodItemId, quantity: qty });
      fetchCart();
    } catch (err) { console.error(err); }
  }

  async function removeItem(foodItemId: string) {
    try {
      const studentId = decodeTokenId();
      await api.post('/cart/remove', { studentId, foodItemId });
      fetchCart();
    } catch (err) { console.error(err); }
  }

  async function clearCart() {
    try {
      const studentId = decodeTokenId();
      await api.post('/cart/clear', { studentId });
      fetchCart();
    } catch (err) { console.error(err); }
  }

  async function submitOrder() {
    try {
      if (!cart || !cart._id) return alert('No cart');
      await api.post(`/cart/${cart._id}/submit`, { pickupLocation: pickup });
      alert('Order submitted');
      fetchCart();
    } catch (err) { console.error(err); alert('Failed to submit order'); }
  }

  const total = cart?.items?.reduce((s: number, it: any) => s + (it.foodItem?.Price || 0) * (it.quantity || 0), 0) || 0;

  return (
    <BasicLayout menuItems={[]}> 
      <Box sx={{ p:4 }}>
        <Typography variant="h5" mb={2}>Cart</Typography>
        {!cart && <Typography>No items in cart.</Typography>}
        {cart && (
          <Box>
            {cart.items.map((it: any) => (
              <Box key={it.foodItem?._id || Math.random()} sx={{ display:'flex', alignItems:'center', gap:2, mb:2 }}>
                <Box sx={{ width:72, height:56, bgcolor:'#f3f4f6', borderRadius:1, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {it.foodItem?.Photo?.[0]?.url ? (
                    <img src={it.foodItem.Photo[0].url} alt={it.foodItem?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ px:1 }}>No image</Box>
                  )}
                </Box>
                <Box sx={{ flex:1 }}>
                  <Typography variant="subtitle1">{it.foodItem?.name}</Typography>
                  <Typography variant="body2">Price: {it.foodItem?.Price}</Typography>
                </Box>
                <TextField type="number" size="small" value={it.quantity} onChange={(e)=>updateQuantity(it.foodItem._id, Math.max(1, Number(e.target.value)))} sx={{ width:100 }} />
                <IconButton color="error" onClick={()=>removeItem(it.foodItem._id)}><DeleteIcon/></IconButton>
              </Box>
            ))}

            <Box sx={{ mt:2 }}>
              <Typography variant="subtitle1">Total: {total}</Typography>
              <Box sx={{ display:'flex', gap:2, alignItems:'center', mt:1 }}>
                <Select value={pickup} onChange={(e)=>setPickup(String(e.target.value))}>
                  <MenuItem value="UC">UC</MenuItem>
                  <MenuItem value="UD">UD</MenuItem>
                  <MenuItem value="UB">UB</MenuItem>
                  <MenuItem value="N">N</MenuItem>
                </Select>
                <Button variant="contained" onClick={submitOrder}>Submit Order</Button>
                <Button variant="outlined" color="error" onClick={clearCart}>Clear</Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </BasicLayout>
  );
}
