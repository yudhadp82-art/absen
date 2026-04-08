package com.absensi.karyawan.viewmodel

import android.app.Application
import android.content.Context
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.absensi.karyawan.api.RetrofitClient
import com.absensi.karyawan.location.LocationManager
import com.absensi.karyawan.model.AttendanceRequest
import com.absensi.karyawan.model.LocationResult
import com.absensi.karyawan.model.UiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID

class AttendanceViewModel(application: Application) : AndroidViewModel(application) {

    private val context: Context = application.applicationContext
    private val locationManager = LocationManager(context)

    // Permission state
    private val _hasPermission = MutableStateFlow(false)
    val hasPermission: StateFlow<Boolean> = _hasPermission.asStateFlow()

    // Employee info
    private val _employeeId = MutableStateFlow("")
    val employeeId: StateFlow<String> = _employeeId.asStateFlow()

    private val _employeeName = MutableStateFlow("")
    val employeeName: StateFlow<String> = _employeeName.asStateFlow()

    // Location state
    private val _locationState = MutableStateFlow<UiState<LocationResult>>(UiState.Idle)
    val locationState: StateFlow<UiState<LocationResult>> = _locationState.asStateFlow()

    // Attendance state
    private val _attendanceState = MutableStateFlow<UiState<String>>(UiState.Idle)
    val attendanceState: StateFlow<UiState<String>> = _attendanceState.asStateFlow()

    fun onPermissionGranted() {
        _hasPermission.value = true
    }

    fun updateEmployeeId(id: String) {
        _employeeId.value = id
    }

    fun updateEmployeeName(name: String) {
        _employeeName.value = name
    }

    fun getCurrentLocation() {
        if (!_hasPermission.value) {
            _locationState.value = UiState.Error("Izin lokasi belum diberikan")
            return
        }

        viewModelScope.launch {
            try {
                _locationState.value = UiState.Loading

                locationManager.getCurrentLocation().collect { location ->
                    _locationState.value = UiState.Success(location)
                }
            } catch (e: Exception) {
                Log.e("AttendanceViewModel", "Error getting location", e)
                _locationState.value = UiState.Error(
                    e.message ?: "Gagal mengambil lokasi. Pastikan GPS aktif."
                )
            }
        }
    }

    fun submitAttendance(type: String) {
        val currentLocation = (_locationState.value as? UiState.Success)?.data
        val empId = _employeeId.value
        val empName = _employeeName.value

        if (currentLocation == null) {
            _attendanceState.value = UiState.Error("Silakan ambil lokasi terlebih dahulu")
            return
        }

        if (empId.isBlank() || empName.isBlank()) {
            _attendanceState.value = UiState.Error("ID dan Nama karyawan harus diisi")
            return
        }

        viewModelScope.launch {
            try {
                _attendanceState.value = UiState.Loading

                val request = AttendanceRequest(
                    employeeId = empId,
                    employeeName = empName,
                    type = type,
                    latitude = currentLocation.latitude,
                    longitude = currentLocation.longitude,
                    accuracy = currentLocation.accuracy,
                    deviceId = getDeviceId()
                )

                val response = RetrofitClient.attendanceApi.submitAttendance(request)

                if (response.isSuccessful && response.body()?.success == true) {
                    _attendanceState.value = UiState.Success(
                        response.body()?.message ?: "Absensi berhasil"
                    )
                } else {
                    val errorMsg = response.body()?.error ?: "Gagal melakukan absensi"
                    _attendanceState.value = UiState.Error(errorMsg)
                }
            } catch (e: Exception) {
                Log.e("AttendanceViewModel", "Error submitting attendance", e)
                _attendanceState.value = UiState.Error(
                    "Error: ${e.message ?: "Koneksi gagal. Periksa koneksi internet."}"
                )
            }
        }
    }

    fun resetLocationState() {
        _locationState.value = UiState.Idle
    }

    fun resetAttendanceState() {
        _attendanceState.value = UiState.Idle
    }

    private fun getDeviceId(): String {
        return try {
            android.provider.Settings.Secure.getString(
                context.contentResolver,
                android.provider.Settings.Secure.ANDROID_ID
            ) ?: UUID.randomUUID().toString()
        } catch (e: Exception) {
            UUID.randomUUID().toString()
        }
    }
}
