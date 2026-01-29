#!/bin/bash

# Webhook Testing Script
# Tests webhook endpoints with valid signatures

set -e

BASE_URL="${BASE_URL:-http://localhost:3001}"
GITHUB_SECRET="${GITHUB_WEBHOOK_SECRET:-test-secret}"
SLACK_SECRET="${SLACK_SIGNING_SECRET:-test-secret}"
JIRA_SECRET="${JIRA_WEBHOOK_SECRET:-test-secret}"

echo "🔧 Testing Kushim Webhooks"
echo "=========================="
echo "Base URL: $BASE_URL"
echo ""

# Test GitHub Webhook
test_github() {
    echo "📘 Testing GitHub webhook..."
    
    PAYLOAD='{"action":"opened","issue":{"id":123,"title":"Test Issue","body":"Test body","html_url":"https://github.com/test/repo/issues/1","user":{"login":"testuser"},"created_at":"2024-01-01T00:00:00Z","updated_at":"2024-01-01T00:00:00Z","state":"open","number":1,"labels":[]},"repository":{"id":456,"full_name":"test/repo"}}'
    
    SIGNATURE="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$GITHUB_SECRET" -hex | awk '{print $2}')"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/webhooks/github" \
        -H "Content-Type: application/json" \
        -H "X-GitHub-Event: issues" \
        -H "X-Hub-Signature-256: $SIGNATURE" \
        -H "X-GitHub-Delivery: test-$(date +%s)" \
        -d "$PAYLOAD")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo "✅ GitHub webhook: $BODY"
    else
        echo "❌ GitHub webhook failed (HTTP $HTTP_CODE): $BODY"
        return 1
    fi
}

# Test Slack Webhook
test_slack() {
    echo "📗 Testing Slack webhook..."
    
    TIMESTAMP=$(date +%s)
    PAYLOAD='{"token":"test","team_id":"T123","event":{"type":"message","user":"U123","text":"Test message","channel":"C123","ts":"'$TIMESTAMP'.000000"},"type":"event_callback"}'
    
    SIG_BASESTRING="v0:${TIMESTAMP}:${PAYLOAD}"
    SIGNATURE="v0=$(echo -n "$SIG_BASESTRING" | openssl dgst -sha256 -hmac "$SLACK_SECRET" -hex | awk '{print $2}')"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/webhooks/slack" \
        -H "Content-Type: application/json" \
        -H "X-Slack-Request-Timestamp: $TIMESTAMP" \
        -H "X-Slack-Signature: $SIGNATURE" \
        -d "$PAYLOAD")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo "✅ Slack webhook: $BODY"
    else
        echo "❌ Slack webhook failed (HTTP $HTTP_CODE): $BODY"
        return 1
    fi
}

# Test Jira Webhook
test_jira() {
    echo "📙 Testing Jira webhook..."
    
    PAYLOAD='{"webhookEvent":"jira:issue_created","issue":{"id":"10001","key":"TEST-1","fields":{"summary":"Test Issue","description":"Test description","created":"2024-01-01T00:00:00.000+0000","updated":"2024-01-01T00:00:00.000+0000","creator":{"displayName":"Test User"},"status":{"name":"Open"},"priority":{"name":"Medium"}}}}'
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/webhooks/jira" \
        -H "Content-Type: application/json" \
        -H "X-Atlassian-Webhook-Identifier: test-webhook" \
        -d "$PAYLOAD")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo "✅ Jira webhook: $BODY"
    else
        echo "❌ Jira webhook failed (HTTP $HTTP_CODE): $BODY"
        return 1
    fi
}

# Test Google Webhook
test_google() {
    echo "📕 Testing Google webhook..."
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/webhooks/google" \
        -H "Content-Type: application/json" \
        -H "X-Goog-Channel-Id: test-channel-123" \
        -H "X-Goog-Resource-State: update" \
        -H "X-Goog-Resource-Id: test-resource-456" \
        -d '{}')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo "✅ Google webhook: $BODY"
    else
        echo "❌ Google webhook failed (HTTP $HTTP_CODE): $BODY"
        return 1
    fi
}

# Run all tests
FAILED=0

test_github || FAILED=$((FAILED + 1))
echo ""

test_slack || FAILED=$((FAILED + 1))
echo ""

test_jira || FAILED=$((FAILED + 1))
echo ""

test_google || FAILED=$((FAILED + 1))
echo ""

echo "=========================="
if [ $FAILED -eq 0 ]; then
    echo "✅ All webhook tests passed!"
    exit 0
else
    echo "❌ $FAILED webhook test(s) failed"
    exit 1
fi
