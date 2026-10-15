import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { TableSkeleton } from "@/components/shared";
import Login from "@/pages/Login";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Products = lazy(() => import("@/pages/Products"));
const ProductEditor = lazy(() => import("@/pages/ProductEditor"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Media = lazy(() => import("@/pages/Media"));
const Orders = lazy(() => import("@/pages/Orders"));
const Customers = lazy(() => import("@/pages/Customers"));
const Promotions = lazy(() => import("@/pages/Promotions"));
const Delivery = lazy(() => import("@/pages/Delivery"));
const Content = lazy(() => import("@/pages/Content"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogEditor = lazy(() => import("@/pages/BlogEditor"));
const Testimonials = lazy(() => import("@/pages/Testimonials"));
const Staff = lazy(() => import("@/pages/Staff"));
const Audit = lazy(() => import("@/pages/Audit"));
const SiteSettings = lazy(() => import("@/pages/SiteSettings"));
const Profile = lazy(() => import("@/pages/Profile"));

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route
          path="*"
          element={
            <Suspense fallback={<TableSkeleton />}>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="products/new" element={<ProductEditor />} />
                <Route path="products/:id" element={<ProductEditor />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="media" element={<Media />} />
                <Route path="orders" element={<Orders />} />
                <Route path="customers" element={<Customers />} />
                <Route path="promotions" element={<Promotions />} />
                <Route path="delivery" element={<Delivery />} />
                <Route path="content" element={<Content />} />
                <Route path="blog" element={<Blog />} />
                <Route path="blog/new" element={<BlogEditor />} />
                <Route path="blog/:id" element={<BlogEditor />} />
                <Route path="testimonials" element={<Testimonials />} />
                <Route path="staff" element={<Staff />} />
                <Route path="audit" element={<Audit />} />
                <Route path="settings" element={<SiteSettings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="*" element={<p className="py-20 text-center text-muted-foreground">Page not found.</p>} />
              </Routes>
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
