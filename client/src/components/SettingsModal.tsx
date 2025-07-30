import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Settings } from '@/types/trading';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { Settings as SettingsIcon, Send, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const settingsSchema = z.object({
  twelveDataApiKey: z.string().optional(),
  telegramChatId: z.string().optional(),
  minProbability: z.number().min(50).max(95).default(75),
  activeStrategies: z.array(z.string()).default(['ICT', 'SMC', 'FUSION']),
  activeSessions: z.array(z.string()).default(['LONDON', 'NY']),
  notificationPrefs: z.object({
    entries: z.boolean().default(true),
    exits: z.boolean().default(true),
    alerts: z.boolean().default(false),
    summaries: z.boolean().default(false),
  }).default({
    entries: true,
    exits: true,
    alerts: false,
    summaries: false,
  }),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);


  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      twelveDataApiKey: settings?.twelveDataApiKey || '',
      telegramChatId: settings?.telegramChatId || '',
      minProbability: settings?.minProbability || 75,
      activeStrategies: (settings?.activeStrategies || ['ICT', 'SMC', 'FUSION']) as string[],
      activeSessions: (settings?.activeSessions || ['LONDON', 'NY']) as string[],
      notificationPrefs: settings?.notificationPrefs || {
        entries: true,
        exits: true,
        alerts: false,
        summaries: false,
      },
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const response = await apiRequest('POST', '/api/settings', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings saved",
        description: "Your configuration has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testTelegramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/telegram/test');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test message sent",
        description: "Check your Telegram for the test message.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send test message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testApiKeyMutation = useMutation({
    mutationFn: async () => {
      const apiKey = form.getValues('twelveDataApiKey');
      const response = await apiRequest('POST', '/api/twelvedata/test', { apiKey });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "API key is working",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "API key test failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    saveSettingsMutation.mutate(data);
  };

  const strategyOptions = [
    { id: 'ICT', label: 'ICT Framework' },
    { id: 'SMC', label: 'SMC Concepts' },
    { id: 'FUSION', label: 'Fusion Strategies' },
    { id: 'INSTITUTIONAL', label: 'Institutional Flow' },
  ];

  const sessionOptions = [
    { id: 'LONDON', label: 'London' },
    { id: 'NY', label: 'New York' },
    { id: 'ASIA', label: 'Asia' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-dark-600 border-dark-400 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-dark-100">
            <SettingsIcon className="w-5 h-5 mr-2 text-bullish" />
            Settings & Configuration
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* API Configuration */}
          <div>
            <h3 className="text-lg font-semibold text-dark-100 mb-4">API Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-dark-200 mb-2 block">
                  Twelve Data API Key <span className="text-bearish">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder="Enter your Twelve Data API key"
                    {...form.register('twelveDataApiKey')}
                    className="bg-dark-500 border-dark-400 text-dark-100 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => testApiKeyMutation.mutate()}
                    disabled={testApiKeyMutation.isPending || !form.watch('twelveDataApiKey')}
                    className="bg-dark-500 border-dark-400 text-dark-100 hover:bg-dark-400"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {testApiKeyMutation.isPending ? 'Testing...' : 'Test API Key'}
                  </Button>
                </div>
                <div className="bg-warning/10 border border-warning/20 rounded p-3 mt-2">
                  <p className="text-xs text-warning mb-2 font-medium">⚠️ API Key Problem</p>
                  <p className="text-xs text-dark-300">
                    API key juaj tregon gabim 401 (unauthorized). Sigurohuni që:
                    <br />• E keni marrë nga{' '}
                    <a href="https://twelvedata.com/pricing" target="_blank" rel="noopener noreferrer" className="text-bullish underline">
                      twelvedata.com
                    </a>{' '}(falas)
                    <br />• E keni kopjuar saktë pa hapse shtesë
                    <br />• Nuk është expired
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-dark-200 mb-2 block">
                  Telegram Chat ID <span className="text-bearish">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Your Telegram Chat ID (e.g., 123456789)"
                  {...form.register('telegramChatId')}
                  className="bg-dark-500 border-dark-400 text-dark-100"
                />
                <p className="text-xs text-dark-300 mt-1">Send /start to your bot to get your chat ID</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => testTelegramMutation.mutate()}
                  disabled={testTelegramMutation.isPending}
                  className="bg-dark-500 border-dark-400 text-dark-100 hover:bg-dark-400"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {testTelegramMutation.isPending ? 'Sending...' : 'Test Connection'}
                </Button>
              </div>
              
              <p className="text-xs text-dark-300">Required for automated signal notifications</p>
            </div>
          </div>

          {/* Strategy Configuration */}
          <div>
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Strategy Settings</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-dark-200 mb-2 block">
                  Minimum Signal Probability (%)
                </Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[form.watch('minProbability')]}
                    onValueChange={(value) => form.setValue('minProbability', value[0])}
                    min={50}
                    max={95}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-bullish w-12">
                    {form.watch('minProbability')}%
                  </span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-dark-200 mb-3 block">
                  Active Strategy Groups
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {strategyOptions.map((strategy) => (
                    <div key={strategy.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={strategy.id}
                        checked={form.watch('activeStrategies').includes(strategy.id)}
                        onCheckedChange={(checked) => {
                          const current = form.watch('activeStrategies');
                          if (checked) {
                            form.setValue('activeStrategies', [...current, strategy.id]);
                          } else {
                            form.setValue('activeStrategies', current.filter(s => s !== strategy.id));
                          }
                        }}
                        className="data-[state=checked]:bg-bullish data-[state=checked]:border-bullish"
                      />
                      <Label htmlFor={strategy.id} className="text-sm text-dark-200">
                        {strategy.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-dark-200 mb-3 block">
                  Active Trading Sessions
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {sessionOptions.map((session) => (
                    <div key={session.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={session.id}
                        checked={form.watch('activeSessions').includes(session.id)}
                        onCheckedChange={(checked) => {
                          const current = form.watch('activeSessions');
                          if (checked) {
                            form.setValue('activeSessions', [...current, session.id]);
                          } else {
                            form.setValue('activeSessions', current.filter(s => s !== session.id));
                          }
                        }}
                        className="data-[state=checked]:bg-bullish data-[state=checked]:border-bullish"
                      />
                      <Label htmlFor={session.id} className="text-sm text-dark-200">
                        {session.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Notification Preferences</h3>
            
            <div className="space-y-3">
              {[
                { key: 'entries', label: 'Send entry signals' },
                { key: 'exits', label: 'Send exit notifications' },
                { key: 'alerts', label: 'Send market alerts' },
                { key: 'summaries', label: 'Daily summary reports' },
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between">
                  <Label className="text-sm text-dark-200">{pref.label}</Label>
                  <Checkbox
                    checked={form.watch('notificationPrefs')[pref.key as 'entries' | 'exits' | 'alerts' | 'summaries']}
                    onCheckedChange={(checked) => {
                      const current = form.watch('notificationPrefs');
                      form.setValue('notificationPrefs', {
                        ...current,
                        [pref.key]: !!checked
                      });
                    }}
                    className="data-[state=checked]:bg-bullish data-[state=checked]:border-bullish"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-dark-400">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-dark-500 border-dark-400 text-dark-100 hover:bg-dark-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveSettingsMutation.isPending}
              className="bg-bullish hover:bg-green-600 text-white"
            >
              {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
