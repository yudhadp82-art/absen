package com.absensi.karyawan.model

import com.google.gson.annotations.SerializedName

data class AttendanceRequest(
    @SerializedName("employeeId")
    val employeeId: String,

    @SerializedName("employeeName")
    val employeeName: String,

    @SerializedName("type")
    val type: String, // "checkin" or "checkout"

    @SerializedName("latitude")
    val latitude: Double,

    @SerializedName("longitude")
    val longitude: Double,

    @SerializedName("accuracy")
    val accuracy: Float? = null,

    @SerializedName("address")
    val address: String? = null,

    @SerializedName("deviceId")
    val deviceId: String? = null
)

data class AttendanceResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("message")
    val message: String? = null,

    @SerializedName("data")
    val data: AttendanceData? = null,

    @SerializedName("error")
    val error: String? = null
)

data class AttendanceData(
    @SerializedName("id")
    val id: String,

    @SerializedName("employeeId")
    val employeeId: String,

    @SerializedName("employeeName")
    val employeeName: String,

    @SerializedName("type")
    val type: String,

    @SerializedName("location")
    val location: LocationData,

    @SerializedName("timestamp")
    val timestamp: String,

    @SerializedName("deviceId")
    val deviceId: String? = null
)

data class LocationData(
    @SerializedName("latitude")
    val latitude: Double,

    @SerializedName("longitude")
    val longitude: Double,

    @SerializedName("accuracy")
    val accuracy: Float? = null,

    @SerializedName("address")
    val address: String? = null
)

data class AttendanceHistory(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("data")
    val data: List<AttendanceData>,

    @SerializedName("count")
    val count: Int
)
