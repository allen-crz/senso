2025-10-01 18:01:00.869 | INFO     | app.core.database:init_supabase:26 - Supabase client initialized
2025-10-01 18:01:00.870 | WARNING  | app.core.database:init_pool:57 - DATABASE_URL not set, direct PostgreSQL access unavailable
INFO:     127.0.0.1:56670 - "POST /api/v1/auth/login HTTP/1.1" 200 OK
2025-10-01 18:01:07.335 | INFO     | app.services.meter_readings:create_reading:91 - Triggering automatic anomaly detection for reading 060baa4f-6496-4884-bedb-6e74b98ea608
2025-10-01 18:01:07.777 | INFO     | app.core.database:init_service_supabase:36 - Supabase service client initialized
2025-10-01 18:01:08.582 | INFO     | app.services.anomaly_detection:detect_anomaly:47 - Checking anomaly for reading 060baa4f-6496-4884-bedb-6e74b98ea608: 1000.0 water
2025-10-01 18:01:08.700 | INFO     | app.services.anomaly_detection:_get_historical_data:93 - Excluded current reading 060baa4f-6496-4884-bedb-6e74b98ea608, remaining: 0 readings
2025-10-01 18:01:08.700 | INFO     | app.services.anomaly_detection:_check_for_anomalies:106 - Checking anomalies: current=1000.0, historical_count=0
2025-10-01 18:01:08.700 | INFO     | app.services.anomaly_detection:_check_for_anomalies:110 - First reading - accepting as baseline
2025-10-01 18:01:08.701 | INFO     | app.services.meter_readings:create_reading:113 - No anomaly detected
2025-10-01 18:01:08.701 | WARNING  | app.services.meter_readings:create_reading:130 - Failed to invalidate forecast cache: 'CostForecastingEngine' object has no attribute 'invalidate_forecast_cache'
INFO:     127.0.0.1:56670 - "POST /api/v1/readings/ HTTP/1.1" 201 Created
2025-10-01 18:01:08.835 | INFO     | app.services.meter_readings:_get_user_reading_count:173 - Found 1 meter readings for user ccaa995d-e763-419a-9dca-97b978b1de3c, utility water
2025-10-01 18:01:09.950 | INFO     | app.services.meter_readings:create_reading:91 - Triggering automatic anomaly detection for reading 3c8c9560-f8bf-4fc2-a130-206ac537925a
2025-10-01 18:01:10.035 | INFO     | app.services.anomaly_detection:detect_anomaly:47 - Checking anomaly for reading 3c8c9560-f8bf-4fc2-a130-206ac537925a: 2500.0 water
2025-10-01 18:01:10.127 | INFO     | app.services.anomaly_detection:_get_historical_data:93 - Excluded current reading 3c8c9560-f8bf-4fc2-a130-206ac537925a, remaining: 1 readings
2025-10-01 18:01:10.127 | INFO     | app.services.anomaly_detection:_check_for_anomalies:106 - Checking anomalies: current=2500.0, historical_count=1
2025-10-01 18:01:10.129 | INFO     | app.services.anomaly_detection:_check_for_anomalies:138 - Consumption analysis: 1500.0 units since last reading  
2025-10-01 18:01:10.129 | WARNING  | app.services.anomaly_detection:_check_for_anomalies:147 - HIGH WATER CONSUMPTION: 1500.0L
2025-10-01 18:01:10.214 | ERROR    | app.services.anomaly_detection:_save_anomaly_detection:275 - Failed to save anomaly detection: {'code': '23502', 
'details': 'Failing row contains (11d2ed49-d3e6-4cce-b96d-cb2b7d090020, ccaa995d-e763-419a-9dca-97b978b1de3c, 3c8c9560-f8bf-4fc2-a130-206ac537925a, water, 0.600000, t, medium, 1000.000000, {"reason": "Very high water consumption: 1500.0L", "threshold": ..., v1.0.0, null, 2025-10-01 10:01:10.13016+00, f, null, null, null).', 'hint': None, 'message': 'null value in column "training_window_days" of relation "anomaly_detections" violates not-null constraint'}
2025-10-01 18:01:10.216 | INFO     | app.services.meter_readings:create_reading:113 - No anomaly detected
2025-10-01 18:01:10.216 | WARNING  | app.services.meter_readings:create_reading:130 - Failed to invalidate forecast cache: 'CostForecastingEngine' object has no attribute 'invalidate_forecast_cache'
INFO:     127.0.0.1:56670 - "POST /api/v1/readings/ HTTP/1.1" 201 Created
2025-10-01 18:01:10.324 | INFO     | app.services.meter_readings:_get_user_reading_count:173 - Found 2 meter readings for user ccaa995d-e763-419a-9dca-97b978b1de3c, utility water
2025-10-01 18:01:10.411 | INFO     | app.services.anomaly_detection:detect_anomaly:47 - Checking anomaly for reading 3c8c9560-f8bf-4fc2-a130-206ac537925a: 2500.0 water
2025-10-01 18:01:10.499 | INFO     | app.services.anomaly_detection:_get_historical_data:93 - Excluded current reading 3c8c9560-f8bf-4fc2-a130-206ac537925a, remaining: 1 readings
2025-10-01 18:01:10.499 | INFO     | app.services.anomaly_detection:_check_for_anomalies:106 - Checking anomalies: current=2500.0, historical_count=1
2025-10-01 18:01:10.500 | INFO     | app.services.anomaly_detection:_check_for_anomalies:138 - Consumption analysis: 1500.0 units since last reading  
2025-10-01 18:01:10.500 | WARNING  | app.services.anomaly_detection:_check_for_anomalies:147 - HIGH WATER CONSUMPTION: 1500.0L
2025-10-01 18:01:10.584 | ERROR    | app.services.anomaly_detection:_save_anomaly_detection:275 - Failed to save anomaly detection: {'code': '23502', 
'details': 'Failing row contains (ae05eb75-7295-4442-a482-abf6295f6cb7, ccaa995d-e763-419a-9dca-97b978b1de3c, 3c8c9560-f8bf-4fc2-a130-206ac537925a, water, 0.600000, t, medium, 1000.000000, {"reason": "Very high water consumption: 1500.0L", "threshold": ..., v1.0.0, null, 2025-10-01 10:01:10.500365+00, f, null, null, null).', 'hint': None, 'message': 'null value in column "training_window_days" of relation "anomaly_detections" violates not-null constraint'}
INFO:     127.0.0.1:56670 - "POST /api/v1/anomaly-detection/detect HTTP/1.1" 200 OK


2025-10-01 18:03:12.145 | ERROR    | app.services.anomaly_detection:_save_anomaly_detection:276 - Failed to save anomaly detection: 3 validation errors for AnomalyDetectionResponse
utility_type
  Field required [type=missing, input_value={'id': '9e9da98a-68d9-43d...=datetime.timezone.utc)}, input_type=dict]
    For further information visit https://errors.pydantic.dev/2.9/v/missing
model_version
  Field required [type=missing, input_value={'id': '9e9da98a-68d9-43d...=datetime.timezone.utc)}, input_type=dict]
    For further information visit https://errors.pydantic.dev/2.9/v/missing
training_window_days
  Field required [type=missing, input_value={'id': '9e9da98a-68d9-43d...=datetime.timezone.utc)}, input_type=dict]
    For further information visit https://errors.pydantic.dev/2.9/v/missing