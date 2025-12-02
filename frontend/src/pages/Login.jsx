import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "../hooks/useTranslation";

export default function Login() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const from = new URLSearchParams(location.search).get('from') || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await base44.auth.login(email, password);
            if (user) {
                // Force reload to update AuthContext state or use a context method if available
                // For now, reload is safest to ensure all states are fresh
                window.location.href = from;
            }
        } catch (err) {
            setError(err.message || t('auth.errors.loginFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">{t('auth.login.title')}</CardTitle>
                    <CardDescription className="text-center">
                        {t('auth.login.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>{t('auth.errors.generic')}</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('auth.fields.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={t('auth.fields.emailPlaceholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{t('auth.fields.password')}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? t('auth.login.submitting') : t('auth.login.submit')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-600">
                        {t('auth.login.footer')}{' '}
                        <Link to="/register" className="text-blue-600 hover:underline">
                            {t('auth.login.registerLink')}
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
