import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { CustomerList } from "@/components/customers/CustomerList";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  id_document?: string;
  drivers_license?: string;
  address?: string;
  birth_date?: string;
  notes?: string;
  is_active: boolean;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingCustomer(null);
    fetchCustomers();
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gestão de Clientes</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Cadastre e gerencie os clientes</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingCustomer ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerForm customer={editingCustomer} onClose={handleClose} />
            </CardContent>
          </Card>
        ) : (
          <CustomerList
            customers={customers}
            loading={loading}
            onEdit={handleEdit}
            onRefresh={fetchCustomers}
          />
        )}
      </div>
    </Layout>
  );
};

export default Customers;