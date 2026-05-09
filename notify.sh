#!/bin/bash
curl -X POST https://ntfy.sh/mabuyustreet-orders \
  -H "Title: New Order - Mabuyu Street" \
  -H "Priority: urgent" \
  -H "Tags: rotating_light,bell" \
  -d "$1"
