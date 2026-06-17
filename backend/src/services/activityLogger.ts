// backend/src/services/activityLogger.ts

import { prisma } from '../lib/prisma';

type LogAction = 
  | 'LOGIN' | 'LOGOUT' | 'SIGNUP' | 'GOOGLE_SIGNIN'
  | 'CREATE' | 'UPDATE' | 'DELETE' 
  | 'APPROVE' | 'REJECT'
  | 'PASSWORD_CHANGE' | 'PASSWORD_RESET' | 'OTP_REQUEST' | 'OTP_VERIFY'
  | 'PLAN_UPGRADE' | 'PLAN_CHANGE'
  | 'QR_GENERATE' | 'QR_CUSTOMIZE'
  | 'IMAGE_UPLOAD'
  | 'SCHEDULE_CREATE' | 'SCHEDULE_DELETE' | 'SCHEDULE_EXECUTE'
  | 'LOCATION_CREATE' | 'LOCATION_UPDATE' | 'LOCATION_DELETE'
  | 'SETTINGS_UPDATE'
  | 'ADMIN_ACTION';

type LogEntity = 
  | 'USER' | 'RESTAURANT' | 'SUBSCRIPTION' 
  | 'MENU_ITEM' | 'CATEGORY' 
  | 'LOCATION' | 'SCHEDULE' 
  | 'QR_CODE' | 'IMAGE'
  | 'SETTINGS' | 'SYSTEM';

interface LogData {
  userId?: string;
  action: LogAction;
  entity: LogEntity;
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

class ActivityLogger {
  async log(data: LogData): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          action: data.action,
          entity: data.entity,
          entityId: data.entityId || null,
          description: data.description,
          metadata: data.metadata || undefined,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          userId: data.userId || null,
        },
      });
    } catch (error) {
      // Log error but don't throw - activity logging shouldn't break the app
      console.error('Activity logging error:', error);
    }
  }

  // Helper to extract IP and User-Agent from Express request
  extractRequestInfo(req: any): { ipAddress: string; userAgent: string } {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded 
      ? forwarded.split(',')[0].trim() 
      : req.socket?.remoteAddress || req.ip || 'unknown';
    
    return {
      ipAddress: ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    };
  }

  // User-related logs
  async logLogin(userId: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: 'LOGIN',
      entity: 'USER',
      entityId: userId,
      description: 'User logged in successfully',
      ...info,
    });
  }

  async logLogout(userId: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: 'LOGOUT',
      entity: 'USER',
      entityId: userId,
      description: 'User logged out',
      ...info,
    });
  }

  async logSignup(userId: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: 'SIGNUP',
      entity: 'USER',
      entityId: userId,
      description: 'New user registered',
      ...info,
    });
  }

  async logGoogleSignIn(userId: string, isNewUser: boolean, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: 'GOOGLE_SIGNIN',
      entity: 'USER',
      entityId: userId,
      description: isNewUser ? 'New user created via Google Sign-In' : 'User logged in via Google',
      metadata: { isNewUser },
      ...info,
    });
  }

  async logPasswordChange(userId: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: 'PASSWORD_CHANGE',
      entity: 'USER',
      entityId: userId,
      description: 'User changed their password',
      ...info,
    });
  }

  async logPasswordReset(email: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId: undefined,
      action: 'PASSWORD_RESET',
      entity: 'USER',
      entityId: undefined,
      description: `Password reset completed for ${email}`,
      metadata: { email },
      ...info,
    });
  }

  async logOtpRequest(email: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId: undefined,
      action: 'OTP_REQUEST',
      entity: 'USER',
      entityId: undefined,
      description: `Password reset OTP requested for ${email}`,
      metadata: { email },
      ...info,
    });
  }

  async logOtpVerify(email: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId: undefined,
      action: 'OTP_VERIFY',
      entity: 'USER',
      entityId: undefined,
      description: `OTP verified for ${email}`,
      metadata: { email },
      ...info,
    });
  }

  // CRUD logs
  async logCreate(userId: string, entity: LogEntity, entityId: string, description: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: 'CREATE',
      entity,
      entityId,
      description,
      ...info,
    });
  }

  async logUpdate(userId: string, entity: LogEntity, entityId: string, description: string, changes?: any, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: 'UPDATE',
      entity,
      entityId,
      description,
      metadata: changes ? { changes } : undefined,
      ...info,
    });
  }

  async logDelete(userId: string, entity: LogEntity, entityId: string, description: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: 'DELETE',
      entity,
      entityId,
      description,
      ...info,
    });
  }

  // Subscription logs
  async logSubscriptionRequest(userId: string, subscriptionId: string, plan: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: 'CREATE',
      entity: 'SUBSCRIPTION',
      entityId: subscriptionId,
      description: `Subscription upgrade requested to ${plan} plan`,
      metadata: { plan, subscriptionId },
      ...info,
    });
  }

  async logSubscriptionApproved(adminUserId: string, subscriptionId: string, plan: string, restaurantOwnerId: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId: adminUserId,
      action: 'APPROVE',
      entity: 'SUBSCRIPTION',
      entityId: subscriptionId,
      description: `Subscription approved for ${plan} plan`,
      metadata: { plan, subscriptionId, restaurantOwnerId },
      ...info,
    });
  }

  async logSubscriptionRejected(adminUserId: string, subscriptionId: string, plan: string, reason: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId: adminUserId,
      action: 'REJECT',
      entity: 'SUBSCRIPTION',
      entityId: subscriptionId,
      description: `Subscription rejected for ${plan} plan: ${reason || 'No reason provided'}`,
      metadata: { plan, subscriptionId, reason },
      ...info,
    });
  }

  async logPlanUpgrade(userId: string, fromPlan: string, toPlan: string, subscriptionId: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: 'PLAN_UPGRADE',
      entity: 'SUBSCRIPTION',
      entityId: subscriptionId,
      description: `Plan upgraded from ${fromPlan} to ${toPlan}`,
      metadata: { fromPlan, toPlan, subscriptionId },
      ...info,
    });
  }

  // Admin actions
  async logAdminAction(adminUserId: string, action: string, entity: LogEntity, entityId: string, description: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId: adminUserId,
      action: 'ADMIN_ACTION',
      entity,
      entityId,
      description,
      metadata: { adminAction: action },
      ...info,
    });
  }

  // QR and Image logs
  async logQRGenerate(userId: string, restaurantId: string, plan: string, customized: boolean, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: customized ? 'QR_CUSTOMIZE' : 'QR_GENERATE',
      entity: 'QR_CODE',
      entityId: restaurantId,
      description: customized ? 'Custom QR code generated' : 'QR code generated',
      metadata: { plan, customized },
      ...info,
    });
  }

  async logImageUpload(userId: string, menuItemId: string, imageUrl: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: 'IMAGE_UPLOAD',
      entity: 'IMAGE',
      entityId: menuItemId,
      description: `Image uploaded for menu item`,
      metadata: { imageUrl },
      ...info,
    });
  }

  // Schedule logs
  async logScheduleCreate(userId: string, scheduleId: string, action: string, scheduledAt: Date, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: 'SCHEDULE_CREATE',
      entity: 'SCHEDULE',
      entityId: scheduleId,
      description: `Menu schedule created: ${action} scheduled for ${scheduledAt.toISOString()}`,
      metadata: { scheduleAction: action, scheduledAt },
      ...info,
    });
  }

  async logScheduleDelete(userId: string, scheduleId: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: 'SCHEDULE_DELETE',
      entity: 'SCHEDULE',
      entityId: scheduleId,
      description: 'Menu schedule deleted',
      ...info,
    });
  }

  async logScheduleExecute(scheduleId: string, action: string, status: string, req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId: undefined, // System action
      action: 'SCHEDULE_EXECUTE',
      entity: 'SCHEDULE',
      entityId: scheduleId,
      description: `Schedule executed: ${action} - Status: ${status}`,
      metadata: { scheduleAction: action, status },
      ...info,
    });
  }

  // Settings logs
  async logSettingsUpdate(userId: string, restaurantId: string, changes: string[], req?: any): Promise<void> {
    const info = req ? this.extractRequestInfo(req) : { ipAddress: '', userAgent: '' };
    await this.log({
      userId,
      action: 'SETTINGS_UPDATE',
      entity: 'SETTINGS',
      entityId: restaurantId,
      description: `Settings updated: ${changes.join(', ')}`,
      metadata: { changes },
      ...info,
    });
  }
}

// Export singleton instance
export const activityLogger = new ActivityLogger();