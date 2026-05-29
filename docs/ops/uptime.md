# Uptime Monitoring with UptimeRobot

## Overview

PayEasy uses UptimeRobot to continuously monitor the `/api/health` endpoint and alert the team when the application goes down.

## Setup

### 1. Create a free UptimeRobot account

Go to [https://uptimerobot.com](https://uptimerobot.com) and register. The free tier supports up to 50 monitors with 5-minute check intervals.

### 2. Add a new HTTP(S) monitor

1. Click **+ Add New Monitor**
2. Set the following fields:

| Field | Value |
|---|---|
| Monitor Type | HTTP(S) |
| Friendly Name | PayEasy API Health |
| URL | `https://<your-domain>/api/health` |
| Monitoring Interval | 5 minutes |
| Monitor Timeout | 30 seconds |

3. Under **Alert Contacts**, add at least one email address and optionally a Slack webhook (see below).
4. Click **Create Monitor**.

### 3. Configure email alerts

UptimeRobot sends email alerts by default to the account's registered email. To add additional recipients:

1. Go to **My Settings → Alert Contacts**
2. Click **+ Add Alert Contact**
3. Choose **E-mail** and enter the address
4. Click **Save Changes**
5. Return to the monitor and attach the new contact under **Alert Contacts**

### 4. Configure Slack alerts

1. In Slack, create an incoming webhook for your alerts channel:
   - Go to **Apps → Incoming WebHooks → Add to Slack**
   - Choose or create a channel (e.g. `#ops-alerts`)
   - Copy the **Webhook URL**
2. In UptimeRobot, go to **My Settings → Alert Contacts → Add Alert Contact**
3. Choose **Slack** and paste the webhook URL
4. Save and attach the contact to the PayEasy monitor

### 5. Verify the health endpoint

The `/api/health` endpoint must respond with HTTP `200` when the application is healthy. A non-`2xx` response or a connection timeout will trigger a downtime event.

Expected response shape:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Alert behavior

| Event | Trigger | Channels |
|---|---|---|
| Downtime | First failed check | Email + Slack |
| Reminder | Every 30 minutes while down | Email + Slack |
| Recovery | First successful check after downtime | Email + Slack |

UptimeRobot requires **two consecutive failures** before marking a monitor as down, so a single transient failure does not page the team.

## Simulating a 6-minute downtime (acceptance test)

To confirm that alerts fire correctly before going to production:

1. Temporarily stop the application server (or return a non-`200` status from `/api/health`).
2. Wait **6 minutes** (longer than the 5-minute check interval and the two-failure confirmation window).
3. Verify that a **downtime** alert email and Slack message are received.
4. Restore the server.
5. Verify that a **recovery** alert is received.

A successful test confirms that a real outage lasting 6 or more minutes will page the team through both channels.

## Maintenance windows

To suppress false alerts during planned maintenance:

1. Open the monitor in UptimeRobot.
2. Click **Maintenance Windows** → **Add Maintenance Window**.
3. Set the start time, duration, and recurrence (one-time or weekly).
4. Save. No alerts will fire while the maintenance window is active.

## Escalation

If UptimeRobot alerts fire and the on-call engineer does not respond within 15 minutes, escalate using the team's standard incident response runbook.
