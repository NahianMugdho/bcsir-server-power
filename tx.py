import paho.mqtt.client as mqtt
import time
import random

BROKER = "test.mosquitto.org"
PORT = 1883

# All BCSIR topics
TOPICS = {
    "1": "BCSIRbus",
    "2": "BCSIRshunt",
    "3": "BCSIRload",
    "4": "BCSIRcurrent",
    "5": "BCSIRpower"
}

client = mqtt.Client(client_id="bcsir_test_publisher")


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Connected to MQTT Broker")
    else:
        print(f"❌ Connection failed, return code: {rc}")


def on_publish(client, userdata, mid):
    print(f"✅ Message published (mid: {mid})")


client.on_connect = on_connect
client.on_publish = on_publish

print("🔄 Connecting to MQTT Broker...")
client.connect(BROKER, PORT, keepalive=60)
client.loop_start()

time.sleep(2)  # Wait for connection

print("\n" + "=" * 60)
print("📡 MQTT Test Publisher - BCSIR Sensor Topics")
print("=" * 60)
print("\nSelect a topic:")
for key, topic in TOPICS.items():
    print(f"  {key}. {topic}")
print("  6. Send data to all topics")
print("  7. Auto mode (send random data every 5 seconds)")
print("  0. Exit")
print("=" * 60 + "\n")


def send_to_topic(topic, value):
    """Send message to a topic"""
    result = client.publish(topic, value, qos=1)
    print(f"📤 Sent → Topic: {topic}, Value: {value}")
    return result


def send_to_all_topics():
    """Send sample data to all topics"""
    sample_data = {
        "BCSIRbus": str(round(random.uniform(200, 240), 2)),  # Voltage
        "BCSIRshunt": str(round(random.uniform(0, 100), 2)),  # Shunt voltage
        "BCSIRload": str(round(random.uniform(50, 150), 2)),  # Load
        "BCSIRcurrent": str(round(random.uniform(0, 10), 2)),  # Current
        "BCSIRpower": str(round(random.uniform(500, 2000), 2))  # Power
    }

    print("\n📡 Sending data to all topics...\n")
    for topic, value in sample_data.items():
        send_to_topic(topic, value)
        time.sleep(0.5)
    print()


def auto_mode():
    """Auto mode: send data every 5 seconds"""
    print("\n🔄 Auto mode started (Press Ctrl+C to stop)\n")
    try:
        while True:
            send_to_all_topics()
            print("⏳ Waiting 5 seconds...\n")
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n⏹️  Auto mode stopped\n")


try:
    while True:
        choice = input("Enter your choice: ").strip()

        if choice == "0":
            print("\n👋 Exiting...")
            break

        elif choice in ["1", "2", "3", "4", "5"]:
            selected_topic = TOPICS[choice]
            msg = input(f"[{selected_topic}] Enter value: ").strip()
            if msg:
                send_to_topic(selected_topic, msg)
            else:
                print("⚠️  Empty value not allowed\n")

        elif choice == "6":
            send_to_all_topics()

        elif choice == "7":
            auto_mode()

        else:
            print("❌ Invalid choice! Try again\n")

except KeyboardInterrupt:
    print("\n\n⏹️  Program stopped")

finally:
    client.loop_stop()
    client.disconnect()
    print("✅ MQTT connection closed")