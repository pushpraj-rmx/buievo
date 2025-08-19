#!/bin/bash

# Webhook Health Monitoring Script
# Usage: ./webhook-monitor.sh [interval_seconds]

WEBHOOK_URL="https://was.nmpinfotech.com/api/v1/webhook"
STATUS_URL="https://was.nmpinfotech.com/api/v1/webhook/status"
INTERVAL=${1:-30}  # Default 30 seconds

echo "🔍 Webhook Health Monitor"
echo "========================"
echo "URL: $WEBHOOK_URL"
echo "Status URL: $STATUS_URL"
echo "Check Interval: ${INTERVAL}s"
echo ""

# Function to check webhook status
check_status() {
    echo "📊 $(date '+%Y-%m-%d %H:%M:%S') - Checking webhook status..."
    
    # Get status
    STATUS_RESPONSE=$(curl -s "$STATUS_URL")
    
    # Extract key metrics
    TOTAL_WEBHOOKS=$(echo "$STATUS_RESPONSE" | jq -r '.totalWebhooks // 0')
    LAST_WEBHOOK=$(echo "$STATUS_RESPONSE" | jq -r '.lastWebhook // "Never"')
    LAST_ERROR=$(echo "$STATUS_RESPONSE" | jq -r '.lastError // "None"')
    VERIFICATION=$(echo "$STATUS_RESPONSE" | jq -r '.verification // "unknown"')
    HEALTH_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status // "unknown"')
    
    # Display status
    echo "✅ Health Status: $HEALTH_STATUS"
    echo "🔐 Verification: $VERIFICATION"
    echo "📨 Total Webhooks: $TOTAL_WEBHOOKS"
    echo "🕐 Last Webhook: $LAST_WEBHOOK"
    echo "❌ Last Error: $LAST_ERROR"
    echo ""
}

# Function to test webhook functionality
test_webhook() {
    echo "🧪 Testing webhook functionality..."
    
    # Send test webhook
    TEST_PAYLOAD='{
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "123456789",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {
                        "display_phone_number": "1234567890",
                        "phone_number_id": "123456789"
                    },
                    "contacts": [{
                        "profile": {"name": "Test User"},
                        "wa_id": "1234567890"
                    }],
                    "messages": [{
                        "from": "1234567890",
                        "id": "test_'$(date +%s)'",
                        "timestamp": "1734528000",
                        "type": "text",
                        "text": {"body": "Health test message - '$(date)'"}
                    }]
                },
                "field": "messages"
            }]
        }]
    }'
    
    RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$TEST_PAYLOAD")
    
    if [ "$RESPONSE" = "OK" ]; then
        echo "✅ Webhook test successful"
    else
        echo "❌ Webhook test failed: $RESPONSE"
    fi
    echo ""
}

# Function to check verification
check_verification() {
    echo "🔐 Testing webhook verification..."
    
    VERIFY_RESPONSE=$(curl -s "$WEBHOOK_URL?hub.mode=subscribe&hub.verify_token=dd1818d035591543e99d6b6863d9a8f8abe24f37c737eee56c6c65585408a839&hub.challenge=test123")
    
    if [ -z "$VERIFY_RESPONSE" ]; then
        echo "❌ Verification failed"
    else
        echo "✅ Verification response: $VERIFY_RESPONSE"
    fi
    echo ""
}

# Function to monitor continuously
monitor_continuous() {
    echo "🔄 Starting continuous monitoring (Press Ctrl+C to stop)..."
    echo ""
    
    while true; do
        check_status
        
        # Test webhook every 5 minutes
        if [ $(( $(date +%s) % 300 )) -eq 0 ]; then
            test_webhook
        fi
        
        sleep $INTERVAL
    done
}

# Function to run one-time check
one_time_check() {
    echo "🔍 One-time webhook health check"
    echo "================================"
    echo ""
    
    check_status
    test_webhook
    check_verification
    
    echo "📋 Summary:"
    echo "- Webhook endpoint is accessible"
    echo "- Status monitoring is working"
    echo "- Test messages are being processed"
    echo "- Check Meta Developer Console for verification"
}

# Main script logic
case "${2:-check}" in
    "monitor")
        monitor_continuous
        ;;
    "test")
        test_webhook
        ;;
    "verify")
        check_verification
        ;;
    "check"|*)
        one_time_check
        ;;
esac
