import React, { useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../hooks/use-toast';
import { rupiah } from '../mock';

// Polls user's orders and fires an automatic toast pop-up when an order becomes 'success'.
const NOTIFIED_KEY = 'av2_notified_success';

const OrderWatcher = () => {
  const { user } = useAuth();
  const { myOrders } = useStore();
  const { toast } = useToast();
  const knownRef = useRef(new Set());
  const bootedRef = useRef(false);

  useEffect(() => {
    if (!user) { knownRef.current = new Set(); bootedRef.current = false; return; }

    // seed already-notified ids from storage so we don't re-notify on refresh
    const stored = JSON.parse(localStorage.getItem(`${NOTIFIED_KEY}_${user.id}`) || '[]');
    knownRef.current = new Set(stored);

    let mounted = true;

    const check = async () => {
      try {
        const orders = await myOrders();
        const successIds = orders.filter((o) => o.status === 'success');
        if (!bootedRef.current) {
          // first run after login: mark existing successes as known (no pop-up spam)
          successIds.forEach((o) => knownRef.current.add(o.id));
          localStorage.setItem(`${NOTIFIED_KEY}_${user.id}`, JSON.stringify([...knownRef.current]));
          bootedRef.current = true;
          return;
        }
        const fresh = successIds.filter((o) => !knownRef.current.has(o.id));
        fresh.forEach((o) => {
          knownRef.current.add(o.id);
          toast({
            title: 'Pesanan Berhasil!',
            description: `${o.gameName} — ${o.denomName} (${rupiah(o.total)}) berhasil diproses.`,
          });
        });
        if (fresh.length) {
          localStorage.setItem(`${NOTIFIED_KEY}_${user.id}`, JSON.stringify([...knownRef.current]));
        }
      } catch (e) { console.error('OrderWatcher poll failed:', e?.message || e); }
    };

    check();
    const iv = setInterval(() => { if (mounted) check(); }, 8000);
    return () => { mounted = false; clearInterval(iv); };
  }, [user, myOrders, toast]);

  return null;
};

export default OrderWatcher;
